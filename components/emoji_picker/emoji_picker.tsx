// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef, useState, useEffect, useCallback, memo, useMemo} from 'react';
import {FormattedMessage} from 'react-intl';
import type {VariableSizeList} from 'react-window';

import {Emoji, EmojiCategory} from 'mattermost-redux/types/emojis';

import {CategoryOrEmojiRow, Categories, CategoriesOffsets, EmojiCursor, EmojiCursorDirection} from 'components/emoji_picker/types';

import {CATEGORIES, RECENT_EMOJI_CATEGORY, RECENT, SMILEY_EMOTION, CURSOR_DIRECTION} from 'components/emoji_picker/constants';

import {calculateCategoryOffsetsAndIndices, getAllEmojis} from 'components/emoji_picker/utils';

import EmojiPickerPreview from 'components/emoji_picker/components/emoji_picker_preview';
import EmojiPickerSearch from 'components/emoji_picker/components/emoji_picker_search';
import EmojiPickerSkin from 'components/emoji_picker/components/emoji_picker_skin';
import EmojiPickerCategories from 'components/emoji_picker/components/emoji_picker_categories';
import EmojiPickerCustomEmojiButton from 'components/emoji_picker/components/emoji_picker_custom_emoji_button';
import EmojiPickerCurrentResults from 'components/emoji_picker/components/emoji_picker_current_results';

import type {PropsFromRedux} from './index';

interface Props extends PropsFromRedux {
    filter: string;
    visible: boolean;
    onEmojiClick: (emoji: Emoji) => void;
    handleFilterChange: (filter: string) => void;
}

const EmojiPicker = ({
    filter,
    visible,
    onEmojiClick,
    handleFilterChange,
    customEmojisEnabled = false,
    customEmojiPage = 0,
    emojiMap,
    recentEmojis,
    userSkinTone,
    currentTeamName,
    actions: {
        getCustomEmojis,
        searchCustomEmojis,
        incrementEmojiPickerPage,
        setUserSkinTone,
    },
}: Props) => {
    const getInitialActiveCategory = () => (recentEmojis.length ? RECENT : SMILEY_EMOTION);
    const [activeCategory, setActiveCategory] = useState<EmojiCategory>('recent');

    const [cursor, setCursor] = useState<EmojiCursor>({
        rowIndex: -1,
        categoryIndex: -1,
        categoryName: '',
        emojiIndex: -1,
        emoji: undefined,
    });

    const getInitialCategories = () => (recentEmojis.length ? {...RECENT_EMOJI_CATEGORY, ...CATEGORIES} : CATEGORIES);
    const [categories, setCategories] = useState<Categories>(getInitialCategories);

    const [allEmojis, setAllEmojis] = useState<Record<string, Emoji>>({});

    const [categoriesOffsetsAndIndices, setCategoriesOffsetsAndIndices] = useState<CategoriesOffsets>({
        categories: [],
        offsets: [],
        rowIndices: [],
        numOfEmojis: [],
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

    const resultsListRef = useRef<VariableSizeList<CategoryOrEmojiRow[]>>(null);

    useEffect(() => {
        // Delay taking focus because this briefly renders offscreen when using an Overlay
        // so focusing it immediately on mount can cause weird scrolling
        window.requestAnimationFrame(() => {
            searchInputRef.current?.focus();
        });

        const rootComponent = document.getElementById('root');
        rootComponent?.classList.add('emoji-picker--active');

        return () => {
            rootComponent?.classList.remove('emoji-picker--active');
        };
    }, []);

    useEffect(() => {
        const [updatedCategories, updatedAllEmojis] = getAllEmojis(emojiMap, recentEmojis, userSkinTone, categories, allEmojis);

        const categoriesOffsetsAndIndices = calculateCategoryOffsetsAndIndices(updatedAllEmojis, updatedCategories);

        setAllEmojis(updatedAllEmojis);
        setCategories(updatedCategories);
        setCategoriesOffsetsAndIndices(categoriesOffsetsAndIndices);
    }, [emojiMap, userSkinTone, recentEmojis]);

    // Hack for getting focus on search input when tab changes to emoji from gifs
    useEffect(() => {
        searchInputRef.current?.focus();
    }, [visible]);

    // clear out the active category on search input
    useEffect(() => {
        if (activeCategory !== getInitialActiveCategory()) {
            setActiveCategory(getInitialActiveCategory());
        }
    }, [filter]);

    const focusOnSearchInput = useCallback(() => {
        searchInputRef.current?.focus();
    }, []);

    const handleCategoryClick = useCallback((categoryName: string) => {
        const categoryIndex = Object.keys(categories).indexOf(categoryName);
        setCursor([categoryIndex, 0]);

        const categoryRowIndex = categoriesOffsetsAndIndices.rowIndices[categoryIndex];
        resultsListRef?.current?.scrollToItem(categoryRowIndex, 'start');
    }, [JSON.stringify(Object.values(categoriesOffsetsAndIndices)), JSON.stringify(Object.keys(categories))]);

    const resetCursor = useCallback(() => {
        setCursor({
            rowIndex: -1,
            categoryIndex: -1,
            categoryName: '',
            emojiIndex: -1,
            emoji: undefined,
        });
    }, []);

    const getCurrentEmojiByCursor = (currentCursor: EmojiCursor) => {
        const [categoryIndex, emojiIndex] = currentCursor;
        if (categoryIndex === -1 || emojiIndex === -1) {
            return undefined;
        }

        const currentEmojiCategoryName = categoriesOffsetsAndIndices.categories[categoryIndex];
        const currentEmojiCategory = categories[currentEmojiCategoryName];
        const currentEmoji = currentEmojiCategory?.emojiIds?.[emojiIndex] ?? 0;

        const emoji = allEmojis[currentEmoji];
        return emoji;
    };

    const selectNextOrPrevEmoji = useCallback((offset: number, direction: EmojiCursorDirection) => {
        if (direction !== CURSOR_DIRECTION.NEXT && direction !== CURSOR_DIRECTION.PREVIOUS) {
            return null;
        }

        const [categoryIndex, emojiIndex] = cursor;

        const offsetDirectionInSameCategory = direction === CURSOR_DIRECTION.NEXT ? offset : -(offset);

        // moving to next or previous emoji in same category
        const newCursorInSameCategory: EmojiCursor = [categoryIndex, emojiIndex + offsetDirectionInSameCategory];
        if (getCurrentEmojiByCursor(newCursorInSameCategory)) {
            setCursor(newCursorInSameCategory);
            return null;
        }

        // In next direction, if next emoji doesn't exist in same category, move to next category
        const firstCursorInNextCategory: EmojiCursor = [categoryIndex + 1, 0]; // first emoji in next category
        if (direction === CURSOR_DIRECTION.NEXT && getCurrentEmojiByCursor(firstCursorInNextCategory)) {
            setCursor(firstCursorInNextCategory);
            return null;
        }

        // In previous direction, if previous emoji doesn't exist in same category, move to last emoji of previous category
        if (direction === CURSOR_DIRECTION.PREVIOUS && categoryIndex !== 0) {
            const previousCategoryIndex = categoryIndex - 1;
            const numOfEmojisInPreviousCategory = categoriesOffsetsAndIndices.numOfEmojis[previousCategoryIndex];
            const lastCursorInPreviousCategory: EmojiCursor = [previousCategoryIndex, numOfEmojisInPreviousCategory - 1]; // last emoji in previous category
            if (getCurrentEmojiByCursor(lastCursorInPreviousCategory)) {
                setCursor(lastCursorInPreviousCategory);
                return null;
            }
        }

        return null;
    }, [cursor, JSON.stringify(Object.values(categoriesOffsetsAndIndices))]);

    const handleEnterOnEmoji = useCallback(() => {
        const clickedEmoji = getCurrentEmojiByCursor(cursor);

        if (clickedEmoji) {
            onEmojiClick(clickedEmoji);
        }
    }, [cursor.categoryIndex, cursor.emojiIndex, onEmojiClick]);

    const handleEmojiOnMouseOver = useCallback((cursor: EmojiCursor) => {
        setCursor(cursor);
    }, []);

    const cursorEmojiName = useMemo(() => {
        const {emoji} = cursor;

        if (!emoji) {
            return '';
        }

        const name = emoji.short_name ? emoji.short_name : emoji.name;
        return name.replace(/_/g, ' ');
    }, [cursor.categoryIndex, cursor.emojiIndex]);

    return (
        <div
            className='emoji-picker__inner'
            role='application'
        >
            <div
                aria-live='assertive'
                className='sr-only'
            >
                <FormattedMessage
                    id='emoji_picker_item.emoji_aria_label'
                    defaultMessage='{emojiName} emoji'
                    values={{
                        emojiName: cursorEmojiName,
                    }}
                />
            </div>
            <div className='emoji-picker__search-container'>
                <EmojiPickerSearch
                    ref={searchInputRef}
                    value={filter}
                    focus={focusOnSearchInput}
                    onEnter={handleEnterOnEmoji}
                    cursor={cursor}
                    customEmojisEnabled={customEmojisEnabled}
                    handleFilterChange={handleFilterChange}
                    resetCursorPosition={resetCursor}
                    selectNextOrPrevEmoji={selectNextOrPrevEmoji}
                    searchCustomEmojis={searchCustomEmojis}
                />
                <EmojiPickerSkin
                    userSkinTone={userSkinTone}
                    onSkinSelected={setUserSkinTone}
                />
            </div>
            <EmojiPickerCategories
                isFiltering={filter.length > 0}
                active={activeCategory}
                onClick={handleCategoryClick}
                categories={categories}
                selectNextOrPrevEmoji={selectNextOrPrevEmoji}
                focusOnSearchInput={focusOnSearchInput}
            />
            <EmojiPickerCurrentResults
                ref={resultsListRef}
                filter={filter}
                activeCategory={activeCategory}
                allEmojis={allEmojis}
                categories={categories}
                userSkinTone={userSkinTone}
                cursorCategoryIndex={cursor.categoryIndex}
                cursorEmojiIndex={cursor.emojiIndex}
                setActiveCategory={setActiveCategory}
                onEmojiClick={onEmojiClick}
                onEmojiMouseOver={handleEmojiOnMouseOver}
            />
            <div className='emoji-picker__footer'>
                <EmojiPickerPreview
                    emoji={cursor.emoji}
                />
                <EmojiPickerCustomEmojiButton
                    currentTeamName={currentTeamName}
                    customEmojisEnabled={customEmojisEnabled}
                />
            </div>
        </div>
    );
};

export default memo(EmojiPicker);
