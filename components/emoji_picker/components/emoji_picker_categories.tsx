// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {KeyboardEvent, memo, useMemo} from 'react';

import {EmojiCategory} from 'mattermost-redux/types/emojis';

import {Categories, EmojiCursorDirection} from 'components/emoji_picker/types';

import {CURSOR_DIRECTION, EMOJI_PER_ROW} from 'components/emoji_picker/constants';

import EmojiPickerCategory from 'components/emoji_picker/components/emoji_picker_category';

interface Props {
    categories: Categories;
    isFiltering: boolean;
    active: EmojiCategory;
    onClick: (categoryName: string) => void;
    selectNextOrPrevEmoji: (offset: number, direction: EmojiCursorDirection) => void;
    focusOnSearchInput: () => void;
}

function EmojiPickerCategories({
    categories,
    isFiltering,
    active,
    onClick,
    selectNextOrPrevEmoji,
    focusOnSearchInput,
}: Props) {
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
        case 'ArrowRight':
            event.preventDefault();
            selectNextOrPrevEmoji(1, CURSOR_DIRECTION.NEXT);
            break;
        case 'ArrowLeft':
            event.preventDefault();
            selectNextOrPrevEmoji(1, CURSOR_DIRECTION.PREVIOUS);
            break;
        case 'ArrowUp':
            event.preventDefault();
            selectNextOrPrevEmoji(EMOJI_PER_ROW, CURSOR_DIRECTION.PREVIOUS);
            break;
        case 'ArrowDown':
            event.preventDefault();
            selectNextOrPrevEmoji(EMOJI_PER_ROW, CURSOR_DIRECTION.NEXT);
            break;
        }

        focusOnSearchInput();
    };

    const activeCategory = isFiltering ? Object.keys(categories)[0] : active;

    const emojiPickerCategories = useMemo(() => Object.keys(categories).map((categoryName) => {
        const category = categories[categoryName as EmojiCategory];

        return (
            <EmojiPickerCategory
                key={'header-' + category.name}
                category={category}
                onClick={onClick}
                selected={activeCategory === category.name}
                enable={!isFiltering}
            />
        );
    }), [Object.keys(categories), isFiltering, active]);

    return (
        <div
            id='emojiPickerCategories'
            className='emoji-picker__categories'
            onKeyDown={handleKeyDown}
            role='application'
        >
            {emojiPickerCategories}
        </div>
    );
}

export default memo(EmojiPickerCategories);
