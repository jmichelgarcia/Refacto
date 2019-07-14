import React from 'react';
import Header from '../common/Header';
import Loader from '../common/Loader';
import LoginForm from '../login/LoginForm';
import forbidExtraProps from '../../helpers/forbidExtraProps';
import useUserToken from '../../hooks/data/useUserToken';
import useRetroList from '../../hooks/data/useRetroList';
import RetroList from './RetroList';
import './RetroListPage.less';

const RetroListPage = () => {
  const [userToken] = useUserToken();
  const [retroListState, error] = useRetroList(userToken);

  // TODO TypeScript#16
  const retroList = retroListState ? retroListState.retros : null;

  let content;

  if (userToken) {
    content = (
      <Loader
        error={error}
        loading={!retroList}
        Component={RetroList}
        retros={retroList}
      />
    );
  } else {
    content = (
      <LoginForm
        message="Sign in to see your existing retros or create new ones"
      />
    );
  }

  return (
    <article className="page-retro-list">
      <Header
        documentTitle="My Retros - Refacto"
        title="My Retros"
        backLink={{ label: 'Home', action: '/' }}
        links={[{ label: 'Create Retro', action: '/create' }]}
      />
      { content }
    </article>
  );
};

forbidExtraProps(RetroListPage);

export default React.memo(RetroListPage);
