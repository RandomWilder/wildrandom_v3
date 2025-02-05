import {
    // Navigation & Core UI
    Menu,
    X,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    ExternalLink,
    
    // Authentication & User
    User,
    Users,
    LogOut,
    LogIn,
    UserPlus,
    Shield,
    Key,
    
    // Finance & Transactions
    Wallet,
    DollarSign,
    CreditCard,
    ChartBar,
    Coins,
    
    // Gaming & Raffles
    Ticket,
    Tag,
    Gift,
    Trophy,
    Timer,
    Clock,
    
    // Feedback & Status
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Bell,
    
    // Profile & Settings
    Settings,
    Mail,
    Phone,
    Edit,
    
    // Loading & Progress
    Loader,
    RefreshCw
  } from 'lucide-react';
  
  // Export icon groups semantically
  export const navigationIcons = {
    Menu,
    Close: X,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    ExternalLink
  };
  
  export const authIcons = {
    User,
    Users,
    LogIn,
    LogOut,
    UserPlus,
    Shield,
    Key
  };
  
  export const financeIcons = {
    Wallet,
    DollarSign,
    CreditCard,
    ChartBar,
    Coins
  };
  
  export const gameIcons = {
    Ticket,
    Tag,
    Gift,
    Trophy,
    Timer,
    Clock
  };
  
  export const feedbackIcons = {
    Success: CheckCircle,
    Warning: AlertTriangle,
    Error: AlertCircle,
    Notification: Bell
  };
  
  export const profileIcons = {
    Settings,
    Mail,
    Phone,
    Edit
  };
  
  export const loadingIcons = {
    Spinner: Loader,
    Refresh: RefreshCw
  };
  
  // Type definitions for icon props
  export interface IconProps {
    size?: number | string;
    color?: string;
    strokeWidth?: number;
    className?: string;
  }
  
  // Re-export individual icons with consistent props
  export { 
    Menu, X, ChevronDown, ChevronUp, ChevronRight, ArrowRight, ArrowLeft, ExternalLink,
    User, Users, LogOut, LogIn, UserPlus, Shield, Key,
    Wallet, DollarSign, CreditCard, ChartBar, Coins,
    Ticket, Tag, Gift, Trophy, Timer, Clock,
    CheckCircle, AlertCircle, AlertTriangle, Bell,
    Settings, Mail, Phone, Edit,
    Loader, RefreshCw
  };