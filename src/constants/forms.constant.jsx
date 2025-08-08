import { FaEnvelope, FaLock, FaUser } from "react-icons/fa"
export const loginForm =()=>{
   return [
        {
            name: "email",
            label: "Email",
            placeholder:"Enter the emails",
            type: "text",
            icon:  <FaEnvelope />,
            isRequired: true,
            inputType:  "email",
        },
        {
            name: "password",
            label: "Password",
            placeholder:"Enter the password",
            type: "password",
            icon: <FaLock />,
            isRequired: true,
        },
    ]
}
export const forgotForm =()=>{
   return [
        {
            name: "email",
            label: "Email",
            placeholder:"Enter the emails",
            type: "text",
            icon:  <FaEnvelope />,
            isRequired: true,
            inputType:  "email",
        },
    ]
}

export const resetForm =()=>{
   return [
       {
            name: "password",
            label: "Password",
            placeholder:"Enter the password",
            type: "password",
            icon: <FaLock />,
            isRequired: true,
        },
        {
            name: "passwordConfirm",
            label: "Confirm Password",
            placeholder:"Confirm Password",
            type: "password",
            icon: <FaLock />,
            isRequired: true,
        },
    ]
}
export const registerForm =()=>{
   return [
        {
            name: "firstName",
            label: "First Name",
            placeholder:"Enter the First Name",
            type: "text",
            icon:  <FaUser />,
            isRequired: true,
            inputType:  "text",
        },
        {
            name: "lastName",
            label: "Last Name",
            placeholder:"Enter the Last Name",
            type: "text",
            icon:  <FaUser />,
            isRequired: true,
            inputType:  "text",
        },
        {
            name: "email",
            label: "Email",
            placeholder:"Enter the emails",
            type: "text",
            icon:  <FaEnvelope />,
            isRequired: true,
            inputType:  "email",
        },
        {
            name: "password",
            label: "Password",
            placeholder:"Enter the password",
            type: "password",
            icon: <FaLock />,
            isRequired: true,
        },
        {
            name: "passwordConfirm",
            label: "Confirm Password",
            placeholder:"Confirm Password",
            type: "password",
            icon: <FaLock />,
            isRequired: true,
        },
    ]
}