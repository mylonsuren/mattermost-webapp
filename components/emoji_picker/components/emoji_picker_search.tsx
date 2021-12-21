// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {
    ChangeEvent,
    forwardRef,
    KeyboardEvent,
    memo,
} from 'react';
import {FormattedMessage} from 'react-intl';

import {t} from 'utils/i18n';

import LocalizedInput from 'components/localized_input/localized_input';

import {EMOJI_PER_ROW, CURSOR_DIRECTION} from '../constants';
import {EmojiCursorDirection} from '../types';

interface Props {
    value: string;
    focus: () => void;
    onEnter: () => void;
    customEmojisEnabled: boolean;
    cursor: [number, number];
    handleFilterChange: (value: string) => void;
    resetCursorPosition: () => void;
    selectNextOrPrevEmoji: (offset: number, direction: EmojiCursorDirection) => void;
    searchCustomEmojis: (value: string) => void;
}

const EmojiPickerSearch = forwardRef<HTMLInputElement, Props>(({value, customEmojisEnabled, cursor, handleFilterChange, resetCursorPosition, selectNextOrPrevEmoji, focus, onEnter, searchCustomEmojis}: Props, ref) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();

        // remove trailing and leading colons
        const value = event.target.value.toLowerCase().replace(/^:|:$/g, '');
        handleFilterChange(value);

        if (customEmojisEnabled && value && value.trim().length) {
            searchCustomEmojis(value);
        }

        resetCursorPosition();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
        case 'ArrowRight':
            if ((cursor[0] !== -1 || cursor[1] !== -1) || (event.currentTarget?.selectionStart ?? 0) + 1 > value.length) {
                event.preventDefault();
                selectNextOrPrevEmoji(1, CURSOR_DIRECTION.NEXT);
            }
            break;
        case 'ArrowLeft':
            if (cursor[0] > 0 || cursor[1] > 0) {
                event.preventDefault();
                selectNextOrPrevEmoji(1, CURSOR_DIRECTION.PREVIOUS);
            } else if (cursor[0] === 0 && cursor[1] === 0) {
                resetCursorPosition();
                event.currentTarget.selectionStart = value.length;
                event.currentTarget.selectionEnd = value.length;
                event.preventDefault();

                focus();
            }
            break;
        case 'ArrowUp':
            event.preventDefault();

            if (event.shiftKey) {
                // If Shift + Ctrl/Cmd + Up is pressed at any time, select/highlight the string to the left of the cursor.
                event.currentTarget.selectionStart = 0;
            } else if (cursor[0] === -1) {
                // If cursor is on the textbox, set the cursor to the beginning of the string.
                event.currentTarget.selectionStart = 0;
                event.currentTarget.selectionEnd = 0;
            } else if (cursor[0] === 0 && cursor[1] < EMOJI_PER_ROW) {
                // If the cursor is highlighting an emoji in the top row, move the cursor back into the text box to the end of the string.
                resetCursorPosition();
                event.currentTarget.selectionStart = value.length;
                event.currentTarget.selectionEnd = value.length;

                focus();
            } else {
                // Otherwise, move the emoji selector up a row.
                selectNextOrPrevEmoji(EMOJI_PER_ROW, CURSOR_DIRECTION.PREVIOUS);
            }
            break;
        case 'ArrowDown':
            event.preventDefault();

            if (event.shiftKey) {
                // If Shift + Ctrl/Cmd + Down is pressed at any time, select/highlight the string to the right of the cursor.
                event.currentTarget.selectionEnd = value.length;
            } else if (value && event.currentTarget.selectionStart === 0) {
                // If the cursor is at the beginning of the string, move the cursor to the end of the string.
                event.currentTarget.selectionStart = value.length;
                event.currentTarget.selectionEnd = value.length;
            } else {
                // Otherwise, move the selection down in the emoji picker.
                selectNextOrPrevEmoji(EMOJI_PER_ROW, CURSOR_DIRECTION.NEXT);
            }
            break;
        case 'Enter': {
            event.preventDefault();
            onEnter();
            break;
        }
        }
    };

    return (
        <div className='emoji-picker__text-container'>
            <span className='icon-magnify icon emoji-picker__search-icon'/>
            <FormattedMessage
                id='emoji_picker.search_emoji'
                defaultMessage='Search for an emoji'
            >
                {(ariaLabel) => (
                    <LocalizedInput
                        id='emojiPickerSearch'
                        aria-label={`${ariaLabel}`}
                        ref={ref}
                        className='emoji-picker__search'
                        data-testid='emojiInputSearch'
                        type='text'
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        autoComplete='off'
                        placeholder={{
                            id: t('emoji_picker.search'),
                            defaultMessage: 'Search Emoji',
                        }}
                        value={value}
                    />
                )}
            </FormattedMessage>
        </div>
    );
},
);

EmojiPickerSearch.displayName = 'EmojiPickerSearch';

export default memo(EmojiPickerSearch);
