// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef, useState, useEffect, useCallback, memo, useMemo} from 'react';
import {FormattedMessage} from 'react-intl';
import type {FixedSizeList} from 'react-window';

import {Emoji, EmojiCategory} from 'mattermost-redux/types/emojis';

import {NoResultsVariant} from 'components/no_results_indicator/types';
import {CategoryOrEmojiRow, Categories, CategoriesOffsets, EmojiCursor, EmojiCursorDirection} from 'components/emoji_picker/types';

import {CATEGORIES, RECENT_EMOJI_CATEGORY, RECENT, SMILEY_EMOTION, CURSOR_DIRECTION, SEARCH_RESULTS} from 'components/emoji_picker/constants';
import {calculateCategoryOffsetsAndIndices, createCategoryAndEmojiRows, getAllEmojis} from 'components/emoji_picker/utils';

import NoResultsIndicator from 'components/no_results_indicator';
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

    const [categoryOrEmojisRows, setCategoryOrEmojisRows] = useState<CategoryOrEmojiRow[]>([]);

    const [categoriesOffsetsAndIndices, setCategoriesOffsetsAndIndices] = useState<CategoriesOffsets>({
        categories: [],
        offsets: [],
        rowIndices: [],
        numOfEmojis: [],
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

    const resultsListRef = useRef<FixedSizeList<CategoryOrEmojiRow[]>>(null);

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
        setAllEmojis(updatedAllEmojis);
        setCategories(updatedCategories);

        const categoriesOffsetsAndIndices = calculateCategoryOffsetsAndIndices(updatedAllEmojis, updatedCategories);
        setCategoriesOffsetsAndIndices(categoriesOffsetsAndIndices);
    }, [emojiMap, userSkinTone, recentEmojis]);

    useEffect(() => {
        const updatedcategoryOrEmojisRows = createCategoryAndEmojiRows(allEmojis, categories, filter, userSkinTone);
        setCategoryOrEmojisRows(updatedcategoryOrEmojisRows);
    }, [filter, userSkinTone, Object.keys(allEmojis).join(','), Object.keys(categories).join(',')]);

    // Hack for getting focus on search input when tab changes to emoji from gifs
    useEffect(() => {
        searchInputRef.current?.focus();
    }, [visible]);

    // clear out the active category on search input
    useEffect(() => {
        if (activeCategory !== getInitialActiveCategory()) {
            setActiveCategory(getInitialActiveCategory());
        }

        resultsListRef?.current?.scrollToItem(0, 'start');
    }, [filter]);

    const focusOnSearchInput = useCallback(() => {
        searchInputRef.current?.focus();
    }, []);

    const getEmojiById = (currentEmojiId: string) => {
        if (!currentEmojiId) {
            return undefined;
        }

        const emoji = allEmojis[currentEmojiId];
        return emoji;
    };

    const handleCategoryClick = useCallback((categoryRowIndex: CategoryOrEmojiRow['index'], categoryIndex, categoryName: EmojiCategory, emojiIndex) => {
        if (!categoryName || categoryName === activeCategory) {
            return;
        }

        setActiveCategory(categoryName);
        resultsListRef?.current?.scrollToItem(categoryRowIndex, 'start');

        const cursorEmoji = getEmojiById(emojiIndex);
        if (cursorEmoji) {
            setCursor({
                rowIndex: categoryRowIndex + 1,
                categoryIndex,
                categoryName,
                emojiIndex: 0,
                emoji: cursorEmoji,
            });
        }
    }, [activeCategory]);

    const resetCursor = useCallback(() => {
        setCursor({
            rowIndex: -1,
            categoryIndex: -1,
            categoryName: '',
            emojiIndex: -1,
            emoji: undefined,
        });
    }, []);

    const selectNextOrPrevEmoji = useCallback((offset: number, direction: EmojiCursorDirection) => {
        console.log('selectNextOrPrevEmoji', offset, direction);
        if (direction !== CURSOR_DIRECTION.NEXT && direction !== CURSOR_DIRECTION.PREVIOUS) {
            return null;
        }

        // const [categoryIndex, emojiIndex] = cursor;

        // const offsetDirectionInSameCategory = direction === CURSOR_DIRECTION.NEXT ? offset : -(offset);

        // // moving to next or previous emoji in same category
        // const newCursorInSameCategory: EmojiCursor = [categoryIndex, emojiIndex + offsetDirectionInSameCategory];
        // if (getEmojiById(newCursorInSameCategory)) {
        //     setCursor(newCursorInSameCategory);
        //     return null;
        // }

        // // In next direction, if next emoji doesn't exist in same category, move to next category
        // const firstCursorInNextCategory: EmojiCursor = [categoryIndex + 1, 0]; // first emoji in next category
        // if (direction === CURSOR_DIRECTION.NEXT && getEmojiById(firstCursorInNextCategory)) {
        //     setCursor(firstCursorInNextCategory);
        //     return null;
        // }

        // // In previous direction, if previous emoji doesn't exist in same category, move to last emoji of previous category
        // if (direction === CURSOR_DIRECTION.PREVIOUS && categoryIndex !== 0) {
        //     const previousCategoryIndex = categoryIndex - 1;
        //     const numOfEmojisInPreviousCategory = categoriesOffsetsAndIndices.numOfEmojis[previousCategoryIndex];
        //     const lastCursorInPreviousCategory: EmojiCursor = [previousCategoryIndex, numOfEmojisInPreviousCategory - 1]; // last emoji in previous category
        //     if (getEmojiById(lastCursorInPreviousCategory)) {
        //         setCursor(lastCursorInPreviousCategory);
        //         return null;
        //     }
        // }

        return null;
    }, [cursor, JSON.stringify(Object.values(categoriesOffsetsAndIndices))]);

    const handleEnterOnEmoji = useCallback(() => {
        const clickedEmoji = cursor.emoji;

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

    const areSearchResultsEmpty = filter.length !== 0 && categoryOrEmojisRows.length === 1 && categoryOrEmojisRows?.[0]?.items?.[0]?.categoryName === SEARCH_RESULTS;

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
                    cursorCategoryIndex={cursor.categoryIndex}
                    cursorEmojiIndex={cursor.emojiIndex}
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
            {areSearchResultsEmpty ? (
                <NoResultsIndicator
                    variant={NoResultsVariant.ChannelSearch}
                    titleValues={{channelName: `"${filter}"`}}
                />
            ) : (
                <EmojiPickerCurrentResults
                    ref={resultsListRef}
                    isFiltering={filter.length > 0}
                    activeCategory={activeCategory}
                    categoryOrEmojisRows={categoryOrEmojisRows}
                    cursorCategoryIndex={cursor.categoryIndex}
                    cursorEmojiIndex={cursor.emojiIndex}
                    setActiveCategory={setActiveCategory}
                    onEmojiClick={onEmojiClick}
                    onEmojiMouseOver={handleEmojiOnMouseOver}
                />
            )}
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
