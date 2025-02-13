"use client"
import { useState, useEffect } from "react";
import Login from "@/components/Login";
import Signup from "@/components/Signup";
import Event from "@/components/Event";
import Cookies from 'js-cookie';

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(true);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    // Check if auth token exists in cookies
    const token = Cookies.get('auth_token');
    if (token) {
      setLoggedIn(true);
    }
  }, []);

  return (
    <div>
      {loggedIn ? (
        <Event setLoggedIn={setLoggedIn} />
      ) : (
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-4">
                {isLogin ? <Login /> : <Signup />}
                <div className="text-center mt-3">
                  <button 
                    className="btn btn-link" 
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Login"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
