import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { atom, useAtom } from 'jotai';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AuthPanel from '../components/features/AuthPanel';

// Atom for managing authentication panel visibility
export const authPanelVisibleAtom = atom(false);

const MainLayout: FC = () => {
  const [authPanelVisible, setAuthPanelVisible] = useAtom(authPanelVisibleAtom);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header with auth triggers */}
      <Header 
        onAuthTrigger={() => setAuthPanelVisible(true)}
      />
      
      {/* Main content area with responsive container */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Authentication Panel */}
      <AuthPanel 
        isVisible={authPanelVisible}
        onClose={() => setAuthPanelVisible(false)}
      />
    </div>
  );
};

export default MainLayout;