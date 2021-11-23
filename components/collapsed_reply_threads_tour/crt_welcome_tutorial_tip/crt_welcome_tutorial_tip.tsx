// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {FormattedMessage} from 'react-intl';

import {useSelector} from 'react-redux';

import FormattedMarkdownMessage from 'components/formatted_markdown_message.jsx';
import TutorialTip from 'components/tutorial/tutorial_tip';
import {Constants} from 'utils/constants';
import {GlobalState} from 'types/store';
import {getCurrentRelativeTeamUrl} from 'mattermost-redux/selectors/entities/teams';
import {useMeasurePunchouts} from 'components/tutorial/tutorial_tip/hooks';
import {browserHistory} from 'utils/browser_history';

type Props = {
    autoTour: boolean;
};
const CRTWelcomeTutorialTip = ({autoTour}: Props) => {
    const teamUrl = useSelector((state: GlobalState) => getCurrentRelativeTeamUrl(state));
    const nextUrl = `${teamUrl}/threads`;
    const onNextNavigateTo = () => browserHistory.push(nextUrl);
    const title = (
        <FormattedMessage
            id='tutorial_threads.welcome.title'
            defaultMessage='Welcome to the Threads view!'
        />
    );
    const screen = (
        <>
            <p>
                <FormattedMarkdownMessage
                    id='tutorial_threads.welcome.description'
                    defaultMessage={'All the conversations that you’re participating in or following will show here. If you have unread messages or mentions within your threads, you’ll see that here too.'}
                />
            </p>
        </>
    );

    return (
        <TutorialTip
            title={title}
            onNextNavigateTo={onNextNavigateTo}
            placement='right'
            showOptOut={false}
            step={Constants.CrtTutorialSteps.WELCOME_POPOVER}
            tutorialCategory={Constants.Preferences.CRT_TUTORIAL_STEP}
            screen={screen}
            overlayClass='tip-overlay--threads-welcome '
            autoTour={autoTour}
            punchOut={useMeasurePunchouts(['sidebar-threads-button'], [])}
            telemetryTag='tutorial_tip_threads-welcome'
        />
    );
};

export default CRTWelcomeTutorialTip;