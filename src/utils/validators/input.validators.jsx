import * as Yup from 'yup'
export const signInValidator =()=>{
    return Yup.object().shape({
        email: 
            Yup.string().required("Email is empty").email("Invalide email format"),
        password: Yup.string().required("Password is empty"),
    });
}