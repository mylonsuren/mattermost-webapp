// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {forwardRef, memo, useCallback, useEffect, useState} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeList, ListItemKeySelector, ListOnScrollProps} from 'react-window';
import debounce from 'lodash/debounce';

import {Emoji, EmojiCategory} from 'mattermost-redux/types/emojis';

import {NoResultsVariant} from 'components/no_results_indicator/types';
import {Categories, CategoryOrEmojiRow, EmojiCursor} from 'components/emoji_picker/types';

import {createCategoryAndEmojiRows} from 'components/emoji_picker/utils';
import {SEARCH_RESULTS, EMOJI_ROW_HEIGHT, CATEGORY_HEADER_ROW, EMOJIS_ROW, EMOJI_ROWS_OVERSCAN_COUNT} from 'components/emoji_picker/constants';

import NoResultsIndicator from 'components/no_results_indicator';
import EmojiPickerCategoryOrEmojiRow from 'components/emoji_picker/components/emoji_picker_category_or_emoji_row';

// If this changes, the spaceRequiredAbove and spaceRequiredBelow props passed to the EmojiPickerOverlay must be updated
const EMOJI_CONTAINER_HEIGHT = 290;
const EMOJI_PICKER_ITEMS_STYLES = {
    height: EMOJI_CONTAINER_HEIGHT,
};

interface Props {
    filter: string;
    activeCategory: EmojiCategory;
    allEmojis: Record<string, Emoji>;
    categories: Categories;
    userSkinTone: string;
    cursorCategoryIndex: number;
    cursorEmojiIndex: number;
    setActiveCategory: (category: EmojiCategory) => void;
    onEmojiClick: (emoji: Emoji) => void;
    onEmojiMouseOver: (cursor: EmojiCursor) => void;
}

const EmojiPickerCurrentResults = forwardRef<FixedSizeList<CategoryOrEmojiRow[]>, Props>(({filter, activeCategory, allEmojis, categories, userSkinTone, cursorCategoryIndex, cursorEmojiIndex, setActiveCategory, onEmojiClick, onEmojiMouseOver}: Props, ref) => {
    const [categoryOrEmojisRows, setCategoryOrEmojisRows] = useState<CategoryOrEmojiRow[]>([]);

    useEffect(() => {
        const updatedcategoryOrEmojisRows = createCategoryAndEmojiRows(allEmojis, categories, filter, userSkinTone);

        setCategoryOrEmojisRows(updatedcategoryOrEmojisRows);
    }, [filter, userSkinTone, JSON.stringify(Object.keys(allEmojis)), JSON.stringify(Object.keys(categories))]);

    // Function to create unique key for each row
    const getItemKey = (index: Parameters<ListItemKeySelector>[0], rowsData: Parameters<ListItemKeySelector<CategoryOrEmojiRow[]>>[1]) => {
        const data = rowsData[index];

        if (data.type === CATEGORY_HEADER_ROW) {
            const categoryRow = data.row[0] as CategoryOrEmojiRow<typeof CATEGORY_HEADER_ROW>['row'][0];
            return `${categoryRow.categoryIndex}-${categoryRow.categoryName}`;
        }

        const emojisRow = data.row as CategoryOrEmojiRow<typeof EMOJIS_ROW>['row'];
        const emojiNamesArray = emojisRow.map((emoji) => `${emoji.categoryIndex}-${emoji.emojiId}`);
        return emojiNamesArray.join('--');
    };

    // Function to return the height of each row
    const getItemSize = (index: number) => {
        // if (categoryOrEmojisRows[index].type === 'categoryHeaderRow') {
        //     // return CATEGORY_HEADER_ROW_HEIGHT;
        //     return EMOJI_ROW_HEIGHT;
        // }

        return EMOJI_ROW_HEIGHT;
    };

    const handleScroll = (scrollOffset: ListOnScrollProps['scrollOffset'], activeCategoryName: EmojiCategory, filterSearch: string, scrollCategoryOrEmojisRows: CategoryOrEmojiRow[]) => {
        if (filterSearch.length) {
            return;
        }

        const approxRowsFromTop = Math.ceil(scrollOffset / EMOJI_ROW_HEIGHT);
        const closestCategory = scrollCategoryOrEmojisRows?.[approxRowsFromTop]?.row[0]?.categoryName;

        if (closestCategory === activeCategoryName || !closestCategory) {
            return;
        }

        setActiveCategory(closestCategory);
    };

    const debouncedScroll = useCallback(debounce(({scrollOffset}: ListOnScrollProps) => {
        handleScroll(scrollOffset, activeCategory, filter, categoryOrEmojisRows);
    }, 150, {leading: true, trailing: true},
    ), [activeCategory, ...categoryOrEmojisRows, filter]);

    const isSearchResultsCategory = categoryOrEmojisRows?.[0]?.row?.[0]?.categoryName === SEARCH_RESULTS;
    if (filter.length !== 0 && categoryOrEmojisRows.length === 1 && isSearchResultsCategory) {
        return (
            <NoResultsIndicator
                variant={NoResultsVariant.ChannelSearch}
                titleValues={{channelName: `"${filter}"`}}
            />
        );
    }

    return (
        <div
            className='emoji-picker__items'
            style={EMOJI_PICKER_ITEMS_STYLES}
        >
            <div
                className='emoji-picker__container'
                role='application'
            >
                <AutoSizer>
                    {({height, width}) => (
                        <FixedSizeList
                            ref={ref}
                            height={height}
                            width={width}
                            layout='vertical'
                            overscanCount={EMOJI_ROWS_OVERSCAN_COUNT}
                            itemCount={categoryOrEmojisRows.length}
                            itemData={categoryOrEmojisRows}
                            itemKey={getItemKey}
                            // estimatedItemSize={EMOJI_ROW_HEIGHT}
                            itemSize={EMOJI_ROW_HEIGHT}
                            onScroll={debouncedScroll}
                        >
                            {({index, style, data}) => (
                                <EmojiPickerCategoryOrEmojiRow
                                    index={index}
                                    style={style}
                                    data={data}
                                    cursorCategoryIndex={cursorCategoryIndex}
                                    cursorEmojiIndex={cursorEmojiIndex}
                                    onEmojiClick={onEmojiClick}
                                    onEmojiMouseOver={onEmojiMouseOver}
                                />
                            )}
                        </FixedSizeList>
                    )}
                </AutoSizer>
            </div>
        </div>
    );
});

EmojiPickerCurrentResults.displayName = 'EmojiPickerCurrentResults';

export default memo(EmojiPickerCurrentResults);
