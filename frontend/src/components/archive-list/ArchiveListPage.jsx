import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import forbidExtraProps from '../../helpers/forbidExtraProps';
import mapRouteToProps from '../../helpers/mapRouteToProps';
import { setActiveRetro } from '../../reducers/activeRetro';
import ArchiveList from './ArchiveList';

const renderLoader = () => (
  <div className="loader">Loading&hellip;</div>
);

export class ArchiveListPage extends React.Component {
  static propTypes = {
    slug: PropTypes.string.isRequired,
    loading: PropTypes.bool,
    onAppear: PropTypes.func.isRequired,
  };

  static defaultProps = {
    loading: false,
  };

  componentDidMount() {
    const { onAppear, slug } = this.props;
    onAppear(slug);
  }

  render() {
    const { loading } = this.props;

    return (
      <article className="page-archive-list">
        <Helmet title="Archives - Refacto" />
        {loading ? renderLoader() : (<ArchiveList />)}
      </article>
    );
  }
}

forbidExtraProps(ArchiveListPage);

const mapStateToProps = (state) => ({
  loading: state.activeRetro.loading,
});

const mapDispatchToProps = {
  onAppear: setActiveRetro,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mapRouteToProps({ slug: 'slug' }),
)(ArchiveListPage);
