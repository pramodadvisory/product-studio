"use client"

import * as React from "react"

type HeaderTitleContextValue = {
  title: string
  setTitle: (title: string) => void
}

export const HeaderTitleContext = React.createContext<HeaderTitleContextValue>({
  title: "",
  setTitle: () => {},
})

export function HeaderTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = React.useState("")
  return (
    <HeaderTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </HeaderTitleContext.Provider>
  )
}

export function useHeaderTitle(title: string) {
  const { setTitle } = React.useContext(HeaderTitleContext)
  React.useEffect(() => {
    setTitle(title)
    return () => setTitle("")
  }, [title, setTitle])
}
