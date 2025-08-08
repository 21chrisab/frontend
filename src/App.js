import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';

// MUI Components
import {
    CssBaseline, Box, ThemeProvider, createTheme, Drawer, AppBar, Toolbar, Typography,
    List, ListItem, ListItemButton, ListItemIcon, ListItemText, Button, CircularProgress,
    Card, CardContent, CardHeader, Collapse, IconButton, Alert
} from '@mui/material';

// MUI Icons
import {
    Mail, Login, Logout, Insights, Settings, Refresh, ChevronRight, ExpandMore,
    Apartment, Inbox as InboxIcon, CheckCircle
} from '@mui/icons-material';

const API_BASE_URL = 'https://backend-1iqu.onrender.com/';
const DRAWER_WIDTH = 260;

// --- 1. App Theme ---
const theme = createTheme({
    palette: {
        primary: {
            main: '#4f46e5', // Indigo
        },
        background: {
            default: '#f8fafc', // Slate 50
        },
    },
    typography: {
        fontFamily: 'Roboto, sans-serif',
    },
});

// --- 2. Authentication Context ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const checkCurrentUser = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/me`, { credentials: 'include' });
                if (!response.ok) throw new Error('Auth check failed');
                const data = await response.json();
                if (data.loggedIn) setUser(data.account);
            } catch (error) {
                console.error("Could not check auth status:", error);
            } finally {
                setIsAuthLoading(false);
            }
        };
        checkCurrentUser();
    }, []);

    const login = () => {
        const loginWindow = window.open(`${API_BASE_URL}/login`, 'microsoftLogin', 'width=500,height=600');
        const timer = setInterval(() => {
            if (loginWindow.closed) {
                clearInterval(timer);
                window.location.reload();
            }
        }, 1000);
    };

    const logout = async () => {
        await fetch(`${API_BASE_URL}/logout`, { credentials: 'include' });
        setUser(null);
    };

    const authValue = { user, login, logout, isAuthLoading, isLoggedIn: !!user };

    return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

// --- 3. Main App Structure ---
function App() {
    const { isLoggedIn } = useContext(AuthContext);
    const [analyzedEmails, setAnalyzedEmails] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFetchAndAnalyze = useCallback(async () => {
        if (!isLoggedIn) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/fetch-emails`, { credentials: 'include' });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            setAnalyzedEmails(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (isLoggedIn) {
            handleFetchAndAnalyze();
        }
    }, [isLoggedIn, handleFetchAndAnalyze]);

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'white', color: 'text.primary', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                <Toolbar>
                    <Insights sx={{ color: 'primary.main', mr: 2 }} />
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        SiteWeave AI
                    </Typography>
                    <AuthStatus />
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box', borderColor: 'divider' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto', p: 1 }}>
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton selected>
                                <ListItemIcon><Mail sx={{color: 'primary.main'}}/></ListItemIcon>
                                <ListItemText primary="Inbox Analysis" />
                            </ListItemButton>
                        </ListItem>
                         <ListItem disablePadding>
                            <ListItemButton>
                                <ListItemIcon><Settings /></ListItemIcon>
                                <ListItemText primary="Settings" />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
                <Toolbar />
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Inbox Analysis</Typography>
                    {isLoggedIn && (
                        <Button
                            variant="outlined"
                            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
                            onClick={handleFetchAndAnalyze}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Analyzing...' : 'Refresh Inbox'}
                        </Button>
                    )}
                </header>
                <ContentArea
                    isLoading={isLoading}
                    error={error}
                    emails={analyzedEmails}
                />
            </Box>
        </Box>
    );
}

// --- 4. Helper Components ---
const AuthStatus = () => {
    const { user, login, logout, isLoggedIn, isAuthLoading } = useContext(AuthContext);

    if (isAuthLoading) return <CircularProgress size={24} />;

    return isLoggedIn ? (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ textAlign: 'right', mr: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user.username}</Typography>
            </Box>
            <IconButton onClick={logout} title="Logout"><Logout /></IconButton>
        </Box>
    ) : (
        <Button variant="contained" startIcon={<Login />} onClick={login}>Connect Outlook</Button>
    );
};

const ContentArea = ({ isLoading, error, emails }) => {
    const { isLoggedIn, login } = useContext(AuthContext);

    if (!isLoggedIn) {
        return (
            <Card sx={{ textAlign: 'center', py: 8 }}>
                <Apartment sx={{ fontSize: 48, color: 'grey.400' }} />
                <Typography variant="h6" mt={2}>Welcome to SiteWeave AI</Typography>
                <Typography color="text.secondary" mt={1}>Connect your Outlook account to begin.</Typography>
                <Button variant="contained" onClick={login} sx={{ mt: 3 }}>Connect Outlook</Button>
            </Card>
        );
    }
    if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto' }} />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (emails.length === 0) {
        return (
             <Card sx={{ textAlign: 'center', py: 8 }}>
                <InboxIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                <Typography variant="h6" mt={2}>Inbox is Ready</Typography>
                <Typography color="text.secondary" mt={1}>Click "Refresh" to analyze the latest emails.</Typography>
            </Card>
        );
    }
    return <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}><EmailList emails={emails} /></Box>;
};

const EmailList = ({ emails }) => emails.map(email => <EmailCard key={email.id} email={email} />);

const EmailCard = ({ email }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { analysis } = email;
    const sentimentColors = {
        Positive: 'success.main',
        Negative: 'error.main',
        Neutral: 'grey.500',
    };

    return (
        <Card variant="outlined" sx={{ borderLeft: 5, borderColor: sentimentColors[analysis.sentiment] || 'grey.500' }}>
            <CardHeader
                action={
                    <IconButton onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? <ExpandMore /> : <ChevronRight />}
                    </IconButton>
                }
                title={email.subject}
                subheader={`From: ${email.from.emailAddress.name}`}
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{ cursor: 'pointer' }}
            />
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <CardContent>
                    <Typography variant="subtitle2" gutterBottom>AI Summary</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>{analysis.summary}</Typography>
                    <Typography variant="subtitle2" gutterBottom>Action Items</Typography>
                    <List dense>
                        {analysis.actionItems.map((item, index) => (
                            <ListItem key={index}>
                                <ListItemIcon sx={{ minWidth: 32 }}><CheckCircle color="success" fontSize="small"/></ListItemIcon>
                                <ListItemText primary={item} />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Collapse>
        </Card>
    );
};

// --- 5. Final Export ---
export default function AppWrapper() {
    return (
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
    );
}