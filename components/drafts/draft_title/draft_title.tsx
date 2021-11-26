// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {FormattedMessage} from 'react-intl';

import {getMissingProfilesByIds} from 'mattermost-redux/actions/users';
import {Channel} from 'mattermost-redux/types/channels';
import {UserProfile} from 'mattermost-redux/types/users';

import {imageURLForUser} from 'utils/utils.jsx';
import {Constants} from 'utils/constants';

import Avatar from 'components/widgets/users/avatar';

import './draft_title.scss';

type Props = {
    channel: Channel;
    channelName: string;
    membersCount?: number;
    selfDraft: boolean;
    teammate?: UserProfile;
    teammateId?: string;
    type: 'channel' | 'thread';
}

function DraftTitle({
    channel,
    channelName,
    membersCount,
    selfDraft,
    teammate,
    teammateId,
    type,
}: Props) {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!teammate?.id && teammateId) {
            dispatch(getMissingProfilesByIds([teammateId]));
        }
    }, [teammate?.id, teammateId]);

    let you = null;
    if (selfDraft) {
        you = (
            <>
                &nbsp;
                <FormattedMessage
                    id='drafts.draft_title.you'
                    defaultMessage={'(you)'}
                />
            </>
        );
    }

    let icon = <i className='icon icon-globe'/>;

    if (channel.type === Constants.PRIVATE_CHANNEL) {
        icon = <i className='icon icon-lock-outline'/>;
    }

    if (channel.type === Constants.DM_CHANNEL && teammate) {
        icon = (
            <Avatar
                size='xs'
                username={teammate?.username}
                url={imageURLForUser(teammate?.id, teammate?.last_picture_update)}
                className='DraftTitle__avatar'
            />
        );
    }

    if (channel.type === Constants.GM_CHANNEL) {
        icon = (
            <div className='DraftTitle__group-icon'>
                {membersCount}
            </div>
        );
    }

    if (type === 'thread') {
        if (
            channel.type !== Constants.GM_CHANNEL &&
            channel.type !== Constants.DM_CHANNEL
        ) {
            return (
                <>
                    <FormattedMessage
                        id='drafts.draft_title.channel_thread'
                        defaultMessage={'Thread in: {icon} <span>{channelName}</span>'}
                        values={{
                            icon,
                            channelName,
                            span: (chunks: React.ReactNode) => (<span>{chunks}</span>),
                        }}
                    />
                    {you}
                </>
            );
        }

        return (
            <>
                <FormattedMessage
                    id='drafts.draft_title.direct_thread'
                    defaultMessage={'Thread to: {icon} <span>{channelName}</span>'}
                    values={{
                        icon,
                        channelName,
                        span: (chunks: React.ReactNode) => (<span>{chunks}</span>),
                    }}
                />
                {you}
            </>
        );
    }

    if (
        channel.type !== Constants.GM_CHANNEL &&
        channel.type !== Constants.DM_CHANNEL
    ) {
        return (
            <FormattedMessage
                id='drafts.draft_title.channel'
                defaultMessage={'In: {icon} <span>{channelName}</span>'}
                values={{
                    icon,
                    channelName,
                    span: (chunks: React.ReactNode) => (<span>{chunks}</span>),
                }}
            />
        );
    }

    return (
        <>
            <FormattedMessage
                id='drafts.draft_title.direct_channel'
                defaultMessage={'To: {icon} <span>{channelName}</span>'}
                values={{
                    icon,
                    channelName,
                    span: (chunks: React.ReactNode) => (<span>{chunks}</span>),
                }}
            />
            {you}
        </>
    );
}

export default memo(DraftTitle);
