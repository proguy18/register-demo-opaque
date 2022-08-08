/* Import the required libraries and types */
import axios from "axios";
// import history from "./history";

/* Change the API base URL based on the environment */
let BASE_URL : string = "http://localhost:48080";

// var BASE_URL: string = "";
// switch (process.env.NODE_ENV) {
//   case "production":
//     BASE_URL = "https://snaccs-in-a-van.herokuapp.com/api";
//     break;
//   case "development":
//   default:
//     BASE_URL = "http://localhost:48080";
//     break;
// }

function getUsers() {
    const endpoint = `${BASE_URL}/users`;
    return axios.get(endpoint);
}

function register(
    name: String,
    password: String
) {
    const endpoint = `${BASE_URL}/users`;
    return axios.post(endpoint, {
        name,
        password
    }).then(
        (response) => {
            console.log(response);
        },
        (error) => {
            console.log(error);
        }
    );
}

function login(
    name: String,
    password: String
) {
    const endpoint = `${BASE_URL}/users/login`;
    return axios.patch(endpoint, { 
        name,
        password
    }).then(
        (response) => {
            console.log(response);
        },
        (error) => {
            alert("Please enter a valid name and password");
            console.log(error);
        }
    )
}

export {
    getUsers,
    register,
    login,
}