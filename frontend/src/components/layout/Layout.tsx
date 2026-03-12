import { Outlet } from "react-router"

const Layout = () => {
  return (
    <div className="flex flex-col h-screen">
        <Outlet />
    </div>
  )
}

export default Layout