import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Header from '../common/Header';
import Loader from '../common/Loader';
import useExistenceCallbacks from '../../hooks/useExistenceCallbacks';
import useBoundCallback from '../../hooks/useBoundCallback';
import { propTypesShapeLoadedRetro } from '../../helpers/dataStructurePropTypes';
import mapRouteToProps from '../../helpers/mapRouteToProps';
import forbidExtraProps from '../../helpers/forbidExtraProps';
import {
  beginConsumingRetro,
  endConsumingRetro,
  setRetroState,
  addRetroItem,
  upvoteRetroItem,
  editRetroItem,
  deleteRetroItem,
  setRetroItemDone,
} from '../../reducers/retro';
import RetroFormatPicker from '../retro-formats/RetroFormatPicker';
import './RetroPage.less';

export const RetroPage = ({
  slug,
  retroData,
  onAppear,
  onDisappear,
  onAddItem,
  onVoteItem,
  onEditItem,
  onDeleteItem,
  onSetItemDone,
  onSetRetroState,
}) => {
  useExistenceCallbacks(onAppear, onDisappear, slug);

  const retro = retroData?.retro;
  const retroName = retro?.name || slug;

  return (
    <article className="page-retro">
      <Header
        documentTitle={`${retroName} - Refacto`}
        title={retroName}
        links={[{ label: 'Archives', url: `/retros/${slug}/archives` }]}
      />
      <Loader
        loading={!retro}
        Component={RetroFormatPicker}
        retroData={retro?.data}
        retroState={retro?.state}
        onAddItem={useBoundCallback(onAddItem, slug)}
        onVoteItem={useBoundCallback(onVoteItem, slug)}
        onEditItem={useBoundCallback(onEditItem, slug)}
        onDeleteItem={useBoundCallback(onDeleteItem, slug)}
        onSetItemDone={useBoundCallback(onSetItemDone, slug)}
        onSetRetroState={useBoundCallback(onSetRetroState, slug)}
      />
    </article>
  );
};

RetroPage.propTypes = {
  slug: PropTypes.string.isRequired,
  retroData: propTypesShapeLoadedRetro,
  onAppear: PropTypes.func.isRequired,
  onDisappear: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onVoteItem: PropTypes.func.isRequired,
  onEditItem: PropTypes.func.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
  onSetItemDone: PropTypes.func.isRequired,
  onSetRetroState: PropTypes.func.isRequired,
};

RetroPage.defaultProps = {
  retroData: null,
};

forbidExtraProps(RetroPage);

const mapStateToProps = (state, { match }) => ({
  retroData: state.retros[match.params.slug] || null,
});

const mapDispatchToProps = {
  onAppear: beginConsumingRetro,
  onDisappear: endConsumingRetro,
  onAddItem: addRetroItem,
  onVoteItem: upvoteRetroItem,
  onEditItem: editRetroItem,
  onDeleteItem: deleteRetroItem,
  onSetItemDone: setRetroItemDone,
  onSetRetroState: setRetroState,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mapRouteToProps({ slug: 'slug' }),
)(RetroPage);
