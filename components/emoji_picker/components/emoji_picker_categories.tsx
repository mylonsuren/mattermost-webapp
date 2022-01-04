// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {KeyboardEvent, memo, useMemo} from 'react';

import {EmojiCategory} from 'mattermost-redux/types/emojis';

import {
    Categories,
    CategoryOrEmojiRow,
    EmojiCursorDirection,
} from 'components/emoji_picker/types';

import {
    CURSOR_DIRECTION,
    EMOJI_PER_ROW,
} from 'components/emoji_picker/constants';
import {calculateCategoryRowIndex} from 'components/emoji_picker/utils';

import EmojiPickerCategory from 'components/emoji_picker/components/emoji_picker_category';

interface Props {
    categories: Categories;
    isFiltering: boolean;
    active: EmojiCategory;
    onClick: (categoryRowIndex: CategoryOrEmojiRow['index'], categoryIndex: number, categoryName: EmojiCategory, firstEmojiId: string) => void;
    selectNextOrPrevEmoji: (
        offset: number,
        direction: EmojiCursorDirection
    ) => void;
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

    const categoryNames = Object.keys(categories) as EmojiCategory[];
    const activeCategory = isFiltering ? categoryNames[0] : active;

    const categoryNamesDependency = Object.values(categories).map((category) => `${category.id}-${category?.emojiIds?.length}`).join(',');

    const emojiPickerCategories = useMemo(() => categoryNames.map((categoryName, index) => {
        const category = categories[categoryName];
        const categoryRowIndex = calculateCategoryRowIndex(categories, categoryName);
        const categoryIndex = index;

        return (
            <EmojiPickerCategory
                key={categoryIndex + category.name}
                category={category}
                categoryIndex={categoryIndex}
                categoryRowIndex={categoryRowIndex}
                onClick={onClick}
                selected={activeCategory === category.name}
                enable={!isFiltering}
            />
        );
    }), [categoryNamesDependency, isFiltering, active]);

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
