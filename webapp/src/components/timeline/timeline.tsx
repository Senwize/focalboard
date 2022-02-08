// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React, {useMemo} from 'react'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {DateProperty} from '../properties/dateRange/dateRange'
import mutator from '../../mutator'

import VisTimeline, {TimelineCard, DateProp} from './vistimeline'

const getDateProperty = (board: Board): IPropertyTemplate | undefined => {
    // Find what property dictates the period
    return board.fields.cardProperties.find((prop) => prop.type === 'date')
}

const getGroupProperty = (board: Board): IPropertyTemplate | undefined => {
    // Find what property dictates the period
    return board.fields.cardProperties.find((prop) => prop.name === 'group')
}

type DateCardFunction = (card: Card) => TimelineCard | null
const createTimelineCard = (dateProperty: IPropertyTemplate, groupProperty?: IPropertyTemplate): DateCardFunction => {
    // Find the property in the card
    return (card: Card) => {
        const value = card.fields.properties[dateProperty.id] as string
        if (!value) {
            return null
        }

        const dateProp: DateProperty = JSON.parse(value)
        if (typeof dateProp.from === 'undefined' || typeof dateProp.to === 'undefined') {
            return null
        }

        const group = groupProperty ? card.fields.properties[groupProperty?.id] as string : undefined

        return {
            ...card,
            date: dateProp as DateProp,
            group,
        }
    }
}

type Props = {
    cards: Card[]
    board: Board,
    onCardClicked: (e: React.MouseEvent, card: Card) => void
    addCard: (groupByOptionId?: string, show?:boolean, properties?: Record<string, string>) => void
}
const Timeline = (props: Props): JSX.Element => {
    const {cards, board} = props

    const possibleDateProperty = getDateProperty(board)
    if (!possibleDateProperty) {
        return <div>{'No date property found'}</div>
    }
    const dateProperty = possibleDateProperty as IPropertyTemplate
    const groupProperty = getGroupProperty(board)
    const dateGetter = useMemo(() => createTimelineCard(dateProperty, groupProperty), [board])
    const dateCards = useMemo(() => cards.map(dateGetter).filter((card) => card !== null), [cards, dateGetter]) as TimelineCard[]

    function onCardMove(card: TimelineCard) {
        // Patch the card
        const newCard: Card = {
            ...card,
            fields: {
                ...card.fields,
                properties: {
                    ...card.fields.properties,
                    [dateProperty.id]: JSON.stringify(card.date),
                },
            },
        }
        if (groupProperty) {
            if (card.group) {
                newCard.fields.properties[groupProperty.id] = card.group
            } else {
                delete newCard.fields.properties[groupProperty.id]
            }
        }

        // eslint-disable-next-line no-console
        console.log({card, newCard})
        mutator.updateBlock(newCard, card, 'update')
    }

    function onCardRemove(card: TimelineCard) {
        mutator.deleteBlock(card)
    }

    function onCardAdd(date: DateProp, group?: string) {
        const properties: Record<string, string> = {
            [dateProperty.id]: JSON.stringify(date),
        }
        if (groupProperty && group) {
            properties[groupProperty.id] = group
        }
        props.addCard('', true, properties)
    }

    return (
        <>
            <VisTimeline
                cards={dateCards}
                onCardMove={onCardMove}
                onCardRemove={onCardRemove}
                onCardClicked={props.onCardClicked}
                addCard={onCardAdd}
            />
        </>
    )
}

export default Timeline
