import { ITEM_IDS, ITEM_LABELS, type GameState, type ItemId } from '../engine/types'
import { validateAction } from '../engine/validation'
import { ItemIcon } from './ItemIcons'

export function InventoryBar({
  state,
  disabled,
  onUse,
}: {
  state: GameState
  disabled: boolean
  onUse: (item: ItemId) => void
}) {
  return (
    <div className="inventory">
      {ITEM_IDS.map((id) => {
        const charges = state.inventory.player[id]
        const reason = validateAction(state, { type: 'USE_ITEM', actor: 'player', item: id })
        const blocked = disabled || Boolean(reason)
        return (
          <button
            key={id}
            type="button"
            className="item-btn"
            disabled={blocked}
            onClick={() => onUse(id)}
            title={reason ?? ITEM_LABELS[id]}
          >
            <ItemIcon id={id} />
            <span className="item-name">{ITEM_LABELS[id]}</span>
            <span className="item-uses">{charges}</span>
          </button>
        )
      })}
    </div>
  )
}
