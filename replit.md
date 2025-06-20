# Generated Assets Investment Platform

## Overview

This is a full-stack web application that allows users to create AI-powered investment index funds using natural language prompts. The platform leverages OpenAI's GPT-4 to analyze investment themes and generate stock portfolios, with real-time data integration and performance tracking.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket connection for live data

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **AI Integration**: OpenAI GPT-4 for natural language processing
- **Real-time Communication**: WebSocket server for live updates
- **Session Management**: PostgreSQL-backed sessions

### Database Schema
- **Users**: Authentication and user management
- **Indexes**: Investment index funds with performance metrics
- **Stocks**: Individual stock holdings within indexes
- **Historical Data**: Time-series performance tracking

## Key Components

### AI-Powered Index Generation
- Natural language prompt processing using OpenAI GPT-4
- Intelligent stock selection based on investment themes
- Automatic symbol lookup and validation
- Real-time stock data integration

### Real-time Data Pipeline
- WebSocket connections for live updates
- Multiple stock data providers (Polygon.io, Finnhub)
- Automatic fallback mechanisms for data reliability
- Performance benchmarking against S&P 500 and NASDAQ

### User Interface
- Responsive dashboard with portfolio overview
- Interactive index creation with example prompts
- Detailed index pages with stock tables and charts
- Real-time performance notifications

## Data Flow

1. **Index Creation**: User enters natural language prompt → AI analyzes and generates stock list → System fetches real-time stock data → Index is created and stored
2. **Real-time Updates**: Stock data providers → Backend processing → WebSocket broadcast → Frontend updates
3. **Performance Tracking**: Historical data collection → Benchmark comparison → Performance metrics calculation → Dashboard display

## External Dependencies

### AI Services
- **OpenAI GPT-4**: Primary AI service for natural language processing
- **Groq API**: Fallback AI service for redundancy

### Financial Data Providers
- **Polygon.io**: Primary stock data provider
- **Finnhub**: Secondary stock data provider for fallback

### Infrastructure
- **Neon Database**: PostgreSQL serverless database
- **Replit**: Development and deployment platform

## Deployment Strategy

### Development Environment
- Replit-based development with hot reload
- PostgreSQL 16 module integration
- Environment variable configuration for API keys

### Production Build
- Vite build for optimized frontend assets
- esbuild for Node.js backend bundling
- Autoscale deployment target on Replit

### Environment Configuration
- Database URL for PostgreSQL connection
- API keys for OpenAI, Groq, Polygon.io, and Finnhub
- Session secrets for secure authentication

## Changelog

- June 20, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.