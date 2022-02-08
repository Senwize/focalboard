// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
/* eslint-disable no-warning-comments */

import React, {createRef, useRef, useEffect} from 'react'
import {DataSet} from 'vis-data'
import {Timeline, TimelineItem, TimelineOptions, TimelineEventPropertiesResult} from 'vis-timeline/esnext'

import {Card} from '../../blocks/card'
import {DateProperty} from '../properties/dateRange/dateRange'

import 'vis-timeline/dist/vis-timeline-graph2d.css'

const UNASSIGNED_GROUP = '___unassigned'

type WithRequired<T, K extends keyof T> = Exclude<T, K> & {
    [P in K]-?: Exclude<T[P], 'null' | 'undefined'>
}
export type DateProp = WithRequired<DateProperty, 'from' | 'to'>
export interface TimelineCard extends Card {
    date: DateProp
    group?: string
}

interface Item extends TimelineItem {
    card: TimelineCard
    group: string
}

function convertToDate(timestamp: number | Date): Date {
    if (typeof timestamp === 'number') {
        return new Date(timestamp)
    }
    return timestamp
}

function createEntry(card: TimelineCard): WithRequired<Item, 'id'> {
    const groupName = card.group || UNASSIGNED_GROUP
    return {
        id: card.id,
        content: card.title,
        start: convertToDate(card.date.from),
        end: convertToDate(card.date.to),
        group: groupName,
        card,
    }
}

interface Props {
    cards: TimelineCard[]
    onCardMove?: (card: TimelineCard) => void
    onCardRemove?: (card: TimelineCard) => void
    onCardClicked?: (e: React.MouseEvent, card: TimelineCard) => void
    addCard: (date: DateProp, group?: string) => void
}
const VisTimeline = (props: Props): JSX.Element => {
    const {cards, onCardMove, onCardRemove, onCardClicked, addCard} = props

    const containerRef = createRef<HTMLDivElement>()
    const timelineRef = useRef<Timeline>()
    const datasetRef = useRef<DataSet<TimelineItem, 'id'>>(new DataSet())

    useEffect(() => {
        // Calculate changes
        const existingIDs = datasetRef.current.getIds() as string[]
        const nowIDs = cards.map((card) => card.id)
        const removedIDs = existingIDs.filter((id) => !nowIDs.includes(id))

        // Remove cards
        removedIDs.forEach((id) => datasetRef.current.remove(id))

        // Update cards
        datasetRef.current.update(cards.map((card) => createEntry(card)))
    }, [cards])

    useEffect(() => {
        function onMove(_item: TimelineItem) {
            const item = _item as Item
            const newCard: TimelineCard = {
                ...item.card,
                group: item.group,
                date: {
                    from: (item.start as Date).getTime(),
                    to: (item.end as Date).getTime(),
                },
            }
            // eslint-disable-next-line no-console
            console.log({item})
            onCardMove && onCardMove(newCard)
        }

        function onRemove(item: TimelineItem) {
            const card = cards.find((c) => c.id === item.id)
            if (!card) {
                return
            }
            onCardRemove && onCardRemove(card)
        }

        function onDoubleClick(event: TimelineEventPropertiesResult) {
            if (event.what !== 'item') {
                return
            }
            const card = cards.find((c) => c.id === event.item)
            if (!card) {
                return
            }
            onCardClicked && onCardClicked(event.event as unknown as React.MouseEvent, card)
        }

        function onAdd(item: TimelineItem, cb: (validatedItem: TimelineItem | null) => void) {
            const group = item.group === UNASSIGNED_GROUP ? undefined : item.group as string
            addCard({
                from: (item.start as Date).getTime(),
                to: (item.end as Date).getTime(),
            }, group)
            cb(null)
        }

        // TODO: Use the `template` option to render items on the timeline
        // TODO: extend TimelineItem to contain DateCard object, use card to render
        // TODO: automatically group to "project" property

        const timelineOpts: TimelineOptions = {
            editable: true,
            showWeekScale: true,

            template: (_item: TimelineItem) => {
                const item = _item as Item
                if (!item) {
                    return '<span>Unnamed</span>'
                }
                if (!item.card) {
                    return `<span>${item.content}</span>`
                }
                return `<span>${item.card.fields.icon} ${item.card.title}</span>`
            },

            onMove,
            onRemove,
            onAdd,
        }
        const tl = new Timeline(containerRef.current as any, datasetRef.current, timelineOpts)

        // Register extra listeners
        tl.on('doubleClick', onDoubleClick)

        // Update reference
        timelineRef.current = tl

        return () => {
            tl.destroy()
        }
    }, [])

    // Get groups from cards
    useEffect(() => {
        const groupNames = new Set<string>()
        datasetRef.current.get().forEach((item) => {
            if (item.group === UNASSIGNED_GROUP) {
                return
            }
            groupNames.add(item.group as string)
        })
        const groups = Array.from(groupNames).map((name) => ({id: name, content: name}))
        groups.push({id: UNASSIGNED_GROUP, content: 'Unassigned'})
        timelineRef.current?.setGroups(groups)
    }, [cards])

    return <div ref={containerRef}/>
}

export default VisTimeline
