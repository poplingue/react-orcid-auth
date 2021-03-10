import React  from 'react';
import {
  BrowserRouter as Router,
  Route,
} from 'react-router-dom';
import 'bulma/css/bulma.css'

import { Auth, useAuthDispatch, useAuthState } from 'react-orcid-auth';

const ORCID_URL = '';
const ORCID_CLIENT_ID = '';
const ORCID_REDIRECT_URI = '';
const CRISPY_SNIFFLE_API = '';

const Home = () => {
  const dispatch = useAuthDispatch();
  const state = useAuthState();
  return (
    <section className="container">
      <h1>Welcome</h1>
      <article>
        <p>{state.user?.firstName}</p>
        <p>{state.user?.lastName}</p>
        <p>{state.message}</p>
      </article>
      <button onClick={() => dispatch({ type: 'SIGNUP', payload: true })}>Login with orcid</button>
      <button onClick={() => dispatch({ type: 'LOGOUT', payload: true })}>Logout</button>
    </section>);
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
