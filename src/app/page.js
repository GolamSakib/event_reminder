"use client"
import { useState } from "react";
import Login from "@/components/Login";
import Signup from "@/components/Signup";
import Event from "@/components/Event";

export default function Home() {
  const [loggedIn, setLoggedin] = useState(true);
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div>
      {loggedIn ? (
        <Event />
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
