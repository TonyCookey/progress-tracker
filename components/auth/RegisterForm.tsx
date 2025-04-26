"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

type RegisterFormInputs = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: string;
  role: string;
  baseName: string;
};

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormInputs>();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const onSubmit = async (data: RegisterFormInputs) => {
    if (data.password !== data.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSuccessMessage("Registration successful! Redirecting...");
        setErrorMessage("");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        const json = await res.json();
        setErrorMessage(json.message ?? "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-sm">
      {successMessage && <p className="text-green-600">{successMessage}</p>}
      {errorMessage && <p className="text-red-600">{errorMessage}</p>}

      <div>
        <label className="block font-medium"> Name</label>
        <input type="text" {...register("name", { required: true })} className="w-full px-4 py-2 border rounded" />
      </div>

      <div>
        <label className="block font-medium">Username</label>
        <input type="text" {...register("username", { required: true })} className="w-full px-4 py-2 border rounded" />
      </div>

      <div>
        <label className="block font-medium">Email</label>
        <input type="email" {...register("email", { required: true })} className="w-full px-4 py-2 border rounded" />
      </div>

      <div>
        <label className="block font-medium">Date of Birth</label>
        <input type="date" {...register("dateOfBirth")} className="w-full px-4 py-2 border rounded" />
      </div>

      <div>
        <label className="block font-medium">Role</label>
        <select {...register("role", { required: true })} className="w-full px-4 py-2 border rounded">
          <option value="">Select Role</option>
          <option value="GENERAL">General</option>
          <option value="COLONEL">Colonel</option>
          <option value="VOLUNTEER">Volunteer</option>
        </select>
      </div>

      <div>
        <label className="block font-medium">Base</label>
        <select {...register("baseName", { required: true })} className="w-full px-4 py-2 border rounded">
          <option value="">Select Base</option>
          <option value="Alpha">Alpha Base</option>
          <option value="Bravo">Bravo Base</option>
        </select>
      </div>

      <div>
        <label className="block font-medium">Password</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} {...register("password", { required: true })} className="w-full px-4 py-2 border rounded" />
          <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div>
        <label className="block font-medium">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword", { required: true })}
            className="w-full px-4 py-2 border rounded"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
        Register
      </button>
    </form>
  );
}
