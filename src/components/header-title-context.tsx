"use client"

import * as React from "react"
import { createPortal } from "react-dom"

type HeaderSlotsContextValue = {
  title: string
  setTitle: (title: string) => void
  /** The DOM node the header exposes for action buttons, or null before mount. */
  actionsTarget: HTMLElement | null
  setActionsTarget: (node: HTMLElement | null) => void
}

const HeaderSlotsContext = React.createContext<HeaderSlotsContextValue>({
  title: "",
  setTitle: () => {},
  actionsTarget: null,
  setActionsTarget: () => {},
})

/** Kept exported for the header, which reads `title` directly. */
export const HeaderTitleContext = HeaderSlotsContext

export function HeaderTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = React.useState("")
  // The portal target lives in state (not a ref) so consumers re-render and
  // mount their portals once the header has provided the node.
  const [actionsTarget, setActionsTarget] =
    React.useState<HTMLElement | null>(null)

  const value = React.useMemo(
    () => ({ title, setTitle, actionsTarget, setActionsTarget }),
    [title, actionsTarget]
  )

  return (
    <HeaderSlotsContext.Provider value={value}>
      {children}
    </HeaderSlotsContext.Provider>
  )
}

export function useHeaderTitle(title: string) {
  const { setTitle } = React.useContext(HeaderSlotsContext)
  React.useEffect(() => {
    setTitle(title)
    return () => setTitle("")
  }, [title, setTitle])
}

/**
 * Registers the header's DOM node as the portal target for page actions.
 * Used by the header itself — render `<div ref={useHeaderActionsTarget()} />`.
 */
export function useHeaderActionsTarget() {
  const { setActionsTarget } = React.useContext(HeaderSlotsContext)
  return React.useCallback(
    (node: HTMLElement | null) => setActionsTarget(node),
    [setActionsTarget]
  )
}

/**
 * Renders its children into the site header's action slot via a portal.
 * Pages drop this anywhere in their tree; it renders nothing locally.
 *
 *   <HeaderActions>
 *     <Button onClick={...}>Export</Button>
 *   </HeaderActions>
 *
 * Because it's a real portal, the children stay in the page's React tree —
 * event handlers, state, and context all work without any memoization games.
 */
export function HeaderActions({ children }: { children: React.ReactNode }) {
  const { actionsTarget } = React.useContext(HeaderSlotsContext)
  if (!actionsTarget) return null
  return createPortal(children, actionsTarget)
}
