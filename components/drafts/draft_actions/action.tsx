// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef} from 'react';
import {Tooltip} from 'react-bootstrap';
import {FormattedMessage} from 'react-intl';
import classNames from 'classnames';

import OverlayTrigger from 'components/overlay_trigger';
import Constants from 'utils/constants';

import './action.scss';

type Props = {
    icon: string;
    id: string;
    name: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    tooltip: {
        id: string;
        defaultMessage: string;
    };
};

function Action({name, icon, onClick, id, tooltip}: Props) {
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
        <div className='DraftAction'>
            <OverlayTrigger
                className='hidden-xs'
                delayShow={Constants.OVERLAY_TIME_DELAY}
                placement='top'
                overlay={
                    <Tooltip
                        id={`tooltip_${id}`}
                        className='hidden-xs'
                    >
                        <FormattedMessage
                            id={tooltip.id}
                            defaultMessage={tooltip.defaultMessage}
                        />
                    </Tooltip>
                }
            >
                <button
                    ref={buttonRef}
                    className={classNames(
                        'DraftAction__button',
                        {'DraftAction__button--delete': name === 'delete'},
                    )}
                    id={`draft_{icon}_${id}`}
                    aria-label={tooltip.defaultMessage}
                    onClick={onClick}
                >
                    <i className={`icon ${icon}`}/>
                </button>
            </OverlayTrigger>
        </div>
    );
}

export default Action;