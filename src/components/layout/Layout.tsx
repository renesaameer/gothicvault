import { Outlet } from "react-router-dom";
import Header from "./Header";
import FloatingIcons from "./FloatingIcons";
import AnnouncementBar from "./AnnouncementBar";
import Footer from "./Footer";
import { LayoutDataProvider } from "./LayoutDataProvider";

const Layout = () => {
  return (
    <LayoutDataProvider>
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <FloatingIcons />
      </div>
    </LayoutDataProvider>
  );
};

export default Layout;
