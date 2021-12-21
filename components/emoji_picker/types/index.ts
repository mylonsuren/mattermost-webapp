// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {EmojiCategory, Emoji} from 'mattermost-redux/types/emojis';

import {
    CATEGORY_HEADER_ROW,
    EMOJIS_ROW,
} from 'components/emoji_picker/constants';

export type Category = {
    className: string;
    emojiIds?: string[];
    id: string;
    message: string;
    name: EmojiCategory;
};

export type Categories = Record<EmojiCategory, Category>;

export type CategoryOrEmojiRow<
    Type = typeof CATEGORY_HEADER_ROW | typeof EMOJIS_ROW
> = {
    type: Type extends typeof CATEGORY_HEADER_ROW
        ? typeof CATEGORY_HEADER_ROW
        : typeof EMOJIS_ROW;
    rowIndex: number;
    row: Array<{
        categoryIndex: number;
        categoryName: EmojiCategory;
        emojiIndex: Type extends typeof CATEGORY_HEADER_ROW ? -1 : number;
        emojiId: Type extends typeof CATEGORY_HEADER_ROW
            ? ''
            : NonNullable<Emoji['id']>;
        emoji: Type extends typeof CATEGORY_HEADER_ROW ? null : Emoji;
    }>;
};

export type CategoriesOffsets = {
    categories: EmojiCategory[];
    offsets: number[];
    rowIndices: number[];
    numOfEmojis: number[];
};

export type EmojiCursor = {
    rowIndex: number;
    categoryIndex: number;
    categoryName: string;
    emojiIndex: number;
    emoji: Emoji | undefined;
};

export type EmojiCursorDirection = 'next' | 'previous';
