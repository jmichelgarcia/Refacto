import React from 'react';
import PropTypes from 'prop-types';
import nullable from 'prop-types-nullable';
import Header from '../common/Header';
import Loader from '../common/Loader';
import withRetroTokenForSlug from '../hocs/withRetroTokenForSlug';
import useRetroReducer from '../../hooks/data/useRetroReducer';
import useArchive from '../../hooks/data/useArchive';
import forbidExtraProps from '../../helpers/forbidExtraProps';
import { formatDate } from '../../time/formatters';
import RetroFormatPicker from '../retro-formats/RetroFormatPicker';
import './ArchivePage.less';

const ArchivePage = ({
  slug,
  retroId,
  archiveId,
  retroToken,
  retroTokenError,
}) => {
  const [retro] = useRetroReducer(retroId, retroToken);
  const [archive, archiveError] = useArchive(retroId, archiveId, retroToken);

  const retroName = retro ? retro.name : slug; // TODO TypeScript#16
  let archiveName = 'Archive';
  if (archive) {
    archiveName = `${formatDate(archive.created)} Archive`;
  }

  // TODO TypeScript#16
  return (
    <article className="page-archive">
      <Header
        documentTitle={`${archiveName} - ${retroName} - Refacto`}
        title={`${retroName} (${archiveName})`}
        backLink={{ label: 'Archives', action: `/retros/${slug}/archives` }}
      />
      <Loader
        loading={!archive}
        error={retroTokenError || archiveError}
        Component={RetroFormatPicker}
        retroData={archive ? archive.data : null}
        retroState={{}}
        archive
      />
    </article>
  );
};

ArchivePage.propTypes = {
  slug: PropTypes.string.isRequired,
  retroId: nullable(PropTypes.string).isRequired,
  archiveId: PropTypes.string.isRequired,
  retroToken: nullable(PropTypes.string).isRequired,
  retroTokenError: PropTypes.string,
};

ArchivePage.defaultProps = {
  retroTokenError: null,
};

forbidExtraProps(ArchivePage);

export default React.memo(withRetroTokenForSlug(ArchivePage));
