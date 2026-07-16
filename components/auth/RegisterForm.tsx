"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

type RegisterFormInputs = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: string;
  gender?: string;
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
      {successMessage && <p className="text-success-700">{successMessage}</p>}
      {errorMessage && <p className="text-danger-500">{errorMessage}</p>}

      <Input label="Name" type="text" {...register("name", { required: true })} error={errors.name && "Name is required"} />

      <Input label="Username" type="text" {...register("username", { required: true })} error={errors.username && "Username is required"} />

      <Input label="Email" type="email" {...register("email", { required: true })} error={errors.email && "Email is required"} />

      <Input label="Date of Birth" type="date" {...register("dateOfBirth")} />

      <Select label="Gender" {...register("gender")}>
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </Select>

      <Select label="Role" {...register("role", { required: true })} error={errors.role && "Role is required"}>
        <option value="">Select Role</option>
        <option value="GENERAL">General</option>
        <option value="COLONEL">Colonel</option>
        <option value="VOLUNTEER">Volunteer</option>
      </Select>

      <Select label="Base" {...register("baseName", { required: true })} error={errors.baseName && "Base is required"}>
        <option value="">Select Base</option>
        <option value="Alpha">Alpha Base</option>
        <option value="Bravo">Bravo Base</option>
      </Select>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            {...register("password", { required: true })}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword", { required: true })}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Register
      </Button>
    </form>
  );
}
