import React, {
  useEffect,
  useState,
  useCallback,
  useReducer,
  createContext,
  useRef,
  useContext
} from 'react'
import Axios from 'axios'
import PropTypes from 'prop-types'
import basicCookie from '@franca/basic-cookie'

// TODO add email, connected, etc.
const getFirstName = (state) => state && state.person?.name['given-names'].value
const getName = (state) =>
  state &&
  `${state.person?.name['given-names'].value} ${state.person?.name['family-name'].value}`
const getLastName = (state) => state && state.person?.name['family-name'].value
const getOrcidId = (state) => state && state['orcid-identifier'].path

const Reducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: {
          name: getName(action.payload),
          firstName: getFirstName(action.payload),
          lastName: getLastName(action.payload),
          orcidId: getOrcidId(action.payload)
        }
      }
    case 'DELETE_USER':
      return { ...state, user: '' }
    case 'SET_MESSAGE':
      return { ...state, message: action.payload }
    case 'SIGNUP':
      return { ...state, signup: action.payload }
    case 'LOGOUT':
      return { ...state, logout: action.payload }
    default:
      return state
  }
}

const initialUserState = {
  user: '',
  message: '',
  signup: false,
  logout: false
}

const Auth = ({
  history,
  children,
  maxAgeCookie,
  cookie,
  cookieHistoryPath,
  orcidUrl,
  orcidClientId,
  orcidRedirectUri,
  crispySniffleApi
}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  }
  const urlParams = new URLSearchParams(window.location.search)
  const componentIsMounted = useRef(true)
  const [state, dispatch] = useReducer(Reducer, initialUserState)
  const [token, setToken] = useState(() => basicCookie.getCookie(cookie))
  const [code, setCode] = useState('')

  const updateToken = (sessionObject) => {
    setToken(sessionObject)
    basicCookie.setCookie(cookie, sessionObject, maxAgeCookie)
  }

  // TODO in the other useEffect ??
  useEffect(
    () => () => {
      componentIsMounted.current = false
    },
    []
  )

  const revokeUser = async (orcid: boolean) => {
    let revoke = true
    basicCookie.eraseCookie(cookie)
    setToken(() => null)
    dispatch({ type: 'DELETE_USER' })

    if (orcid) {
      try {
        revoke = await Axios.post(
          `${crispySniffleApi}/orcid/oauth/token/revoke`,
          { token: token.accessToken },
          config
        )
        if (revoke.data.ok === 'ok') {
          history.push(history.location.pathname)
        }
      } catch (error) {
        dispatch({
          type: 'SET_MESSAGE',
          payload: error.response.data.error_description
        })
      }
    }
    return revoke
  }

  const signup = () => {
    dispatch({ type: 'SIGNUP', payload: false })
    window.location = `${orcidUrl}/oauth/authorize?client_id=${orcidClientId}&response_type=code&redirect_uri=${orcidRedirectUri}&scope=%2Fread-limited`
  }

  const logout = () => {
    dispatch({ type: 'LOGOUT', payload: false })
    revokeUser().then(() => {
      dispatch({ type: 'SET_MESSAGE', payload: 'User deleted' })
      window.open(`${orcidUrl}/signout`, '_blank')
    })
  }

  const updateUser = useCallback(async () => {
    let res = null

    if (!state.user && token) {
      dispatch({ type: 'SET_MESSAGE', payload: '' })
      try {
        res = await Axios.post(`${crispySniffleApi}/orcid/person`, {
          id: token.orcid,
          token: token.accessToken
        })
        if (componentIsMounted.current) {
          dispatch({ type: 'SET_USER', payload: res.data.response })
        }
      } catch (err) {
        if (err.response.data.error === 'invalid_token') {
          dispatch({
            type: 'SET_MESSAGE',
            payload: err.response.data.error_description
          })
          revokeUser(true).then(() => {
            dispatch({ type: 'SET_MESSAGE', payload: 'User revoked' })
          })
        }
      }
    }
    return res
  }, [token])

  const codeExchange = useCallback(async () => {
    let resp = null
    dispatch({ type: 'SET_MESSAGE', payload: '' })
    if (code) {
      try {
        resp = await Axios.post(
          `${crispySniffleApi}/orcid/oauth/token/code`,
          { code },
          config
        )
        const {
          access_token: accessToken,
          orcid,
          refresh_token: refreshToken
        } = resp.data.response
        updateToken({
          accessToken,
          orcid,
          refreshToken
        })
        return resp
      } catch (err) {
        const historyPath = basicCookie.getCookie(cookieHistoryPath)
        history.push(historyPath)
      }
    }
    return resp
  }, [code])

  useEffect(() => () => {
    if (window.location.href.split('?')[0] !== orcidRedirectUri) {
      basicCookie.setCookie(
        cookieHistoryPath,
        history.location.pathname,
        maxAgeCookie
      )
    }
  })

  useEffect(() => {
    // TODO refacto signup/logout
    if (state.logout) {
      logout()
      return
    }
    if (state.signup) {
      signup()
    }

    if (!code && urlParams.get('code')) {
      setCode(urlParams.get('code'))
    }

    if (!token) {
      codeExchange().then((resp) => {
        const historyPath = basicCookie.getCookie(cookieHistoryPath)

        if (resp && historyPath) {
          basicCookie.eraseCookie(cookieHistoryPath)
          history.push(historyPath)
        }
      })
    } else {
      updateUser()
    }
  }, [code, token, state.signup, state.logout])

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  )
}

const AuthStateContext = createContext()
const AuthDispatchContext = createContext()

function useAuthState() {
  const context = useContext(AuthStateContext)
  if (context === undefined) {
    throw new Error('useAuthState must be used within a AuthProvider')
  }

  return context
}

function useAuthDispatch() {
  const context = useContext(AuthDispatchContext)
  if (context === undefined) {
    throw new Error('useAuthDispatch must be used within a AuthProvider')
  }

  return context
}

export { Auth, useAuthState, useAuthDispatch }

Auth.defaultProps = {
  cookie: 'auth_orcid',
  cookieHistoryPath: 'current_pathname',
  maxAgeCookie: 1000
}

Auth.propTypes = {
  children: PropTypes.node.isRequired,
  history: PropTypes.object.isRequired,
  maxAgeCookie: PropTypes.number,
  cookie: PropTypes.string,
  cookieHistoryPath: PropTypes.string,
  orcidUrl: PropTypes.string.isRequired,
  orcidClientId: PropTypes.string.isRequired,
  orcidRedirectUri: PropTypes.string.isRequired,
  crispySniffleApi: PropTypes.string.isRequired
}
