import React, { useState } from "react"
import Sidebar from "./Sidebar"

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <main className="flex-1 overflow-y-auto">
        {React.cloneElement(children as React.ReactElement, {
          isOpen,
          setIsOpen,
        })}
      </main>
    </div>
  )
}

export default Layout
