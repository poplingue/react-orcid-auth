import React from 'react';
import {
  BrowserRouter as Router,
  Route,
} from 'react-router-dom';
import 'bulma/css/bulma.css';

import { Auth, useAuthDispatch, useAuthState } from 'react-orcid-auth';

const ORCID_URL = '';
const ORCID_CLIENT_ID = '';
const ORCID_REDIRECT_URI = '';
const CRISPY_SNIFFLE_API = '';

const Home = () => {
  const dispatch = useAuthDispatch();
  const state = useAuthState();
  return (
    <div className="container">
      <section className="section">
        <div className="box">
          {state.user ? `Your are logged as ${state.user?.firstName || ''} ${state.user?.lastName || ''}` : 'No user logged'}
        </div>
        <h1 className="title">Welcome to react-orcid-auth example</h1>
        <h2 className="subtitle">
          Here you can connect to your app with ORCID authentication
        </h2>
        <div className="block">
          <div className="card">
            <div className="card-content">
              <div className="content">
                <h3 className="title is-4">Project is online</h3>
                <ul>
                  <li>
                    <div>npm package <a href="https://www.npmjs.com/package/react-orcid-auth">react-orcid-auth</a></div>
                  </li>
                  <li>
                    <div>github repository <a href="https://github.com/francasix/react-orcid-auth">react-orcid-auth</a>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <h3 className="title is-2">Try me!</h3>
        <div className="buttons">
          <button className="button is-dark is-large"
                  onClick={() => dispatch({ type: 'SIGNUP', payload: true })}>Signup/Login
          </button>
          <button className="button is-light is-light is-large"
                  onClick={() => dispatch({ type: 'LOGOUT', payload: true })}>Logout
          </button>
        </div>
        <div className="notification">
          <p>{state.message || 'no message'}</p>
        </div>
      </section>
    </div>);
};

const App = () => {
  return <Router>
    <Route
      exact
      path="/"
      render={(props) =>
        <Auth history={props.history}
              orcidUrl={ORCID_URL}
              orcidRedirectUri={ORCID_REDIRECT_URI}
              orcidClientId={ORCID_CLIENT_ID}
              crispySniffleApi={CRISPY_SNIFFLE_API}>
          <Home {...props}/>
        </Auth>
      }
    />
    <Route
      path="/oauth"
      render={(props) =>
        <Auth history={props.history}
              orcidUrl={ORCID_URL}
              orcidRedirectUri={ORCID_REDIRECT_URI}
              orcidClientId={ORCID_CLIENT_ID}
              crispySniffleApi={CRISPY_SNIFFLE_API}>
          <section>Loading...</section>
        </Auth>
      }
    />
  </Router>;
};

export default App;
