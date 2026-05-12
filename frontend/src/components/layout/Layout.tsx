import { Outlet } from "react-router"

const Layout = () => {
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
        <Outlet />
    </div>
  )
}

export default Layout;