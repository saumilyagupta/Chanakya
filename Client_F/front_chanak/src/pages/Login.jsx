import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login
    console.log("Login submitted:", formData);
    toast.success("Logged in successfully");
  };

  return (
    <div className="min-h-screen bg-[#EFF0C6] grid-texture flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md">
        <div className="bg-[#DDD6FE] border-2 border-[#000000] p-6 md:p-10">
          <h2
            className="text-3xl md:text-4xl font-bold text-[#000000] mb-6 text-center"
            style={{
              fontFamily: "TT Firs Neue, sans-serif",
              fontWeight: 700,
            }}
          >
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-[#000000] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-[#000000] text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#000000] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-[#000000] text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#FDE047] border-2 border-[#000000] font-bold text-[#000000] px-6 py-3 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transition-all mb-4"
            >
              Login
            </button>

            <p className="text-center text-sm text-[#000000]">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-bold underline hover:text-blue-600"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
