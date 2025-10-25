import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Presenter from "./pages/Presenter";
import PresenterSession from "./pages/PresenterSession";
import PresenterControl from "./pages/PresenterControl";
import Viewer from "./pages/Viewer";
import AdminInvitations from "./pages/AdminInvitations";
import InvitationAccept from "./pages/InvitationAccept";
import CommercialAccess from "./pages/CommercialAccess";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/presenter"} component={Presenter} />
      <Route path={"/presenter/session/:sessionId"} component={PresenterSession} />
      <Route path={"/presenter/control/:sessionId"} component={PresenterControl} />
      <Route path={"/viewer"} component={Viewer} />
      <Route path={"/view/:code"} component={Viewer} />
      <Route path={"/admin/invitations"} component={AdminInvitations} />
      <Route path={"/invite/:token"} component={InvitationAccept} />
      <Route path={"/commercial/:token"} component={CommercialAccess} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

