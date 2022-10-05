// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getConfig} from 'mattermost-redux/selectors/entities/general';
import {getUser} from 'mattermost-redux/selectors/entities/users';

import {Post} from '@mattermost/types/posts';

import {GlobalState} from 'types/store';

import {getDisplayNameByUser} from 'utils/utils';

import RepliedTo from './replied_to';

type Props = {
    post: Post;
}

function mapStateToProps(state: GlobalState, ownProps: Props) {
    let displayName = '';
    if (ownProps.post) {
        const user = getUser(state, ownProps.post.user_id);
        displayName = getDisplayNameByUser(state, user);
    }

    const config = getConfig(state);
    const enablePostUsernameOverride = config.EnablePostUsernameOverride === 'true';

    return {
        displayName,
        enablePostUsernameOverride,
    };
}

export default connect(mapStateToProps)(RepliedTo);
