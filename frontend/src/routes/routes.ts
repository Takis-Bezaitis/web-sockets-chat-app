import { lazy } from "react";
import { createBrowserRouter } from "react-router";

import Layout from "../components/Layout";
import AuthLayout from "../components/AuthLayout";
import ProtectedLayout from "../components/ProtectedLayout";

const IndexRedirect = lazy(() => import('../pages/IndexRedirect'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Chat = lazy(() => import('../pages/Chat'));

export const routes = createBrowserRouter([
    {path: '/', Component: Layout, 
        children: [
            { index: true, Component: IndexRedirect }, 
            
            // Auth pages
            {   path: "auth",
                Component: AuthLayout, 
                children: [
                    { path: 'login', Component: Login },
                    { path: 'register', Component: Register }
                ]
            },

            // Protected pages
            { Component: ProtectedLayout, 
                children: [
                    { path: "chat", Component: Chat }
                ]
            }
        ]
    }
]);