import axios from "axios";

const getTotalToken = async () => {
    const {
        TOTAL_BASE_URI,
        TOTAL_USERNAME,
        TOTAL_PASSWORD,
    } = process.env.NODE_ENV === "development" ? process.env : process.env;

    if (
        !TOTAL_BASE_URI ||
        !TOTAL_USERNAME ||
        !TOTAL_PASSWORD
    ) {
        throw new Error("Get token: Total credentials are missing.")
    }

    const { data } = await axios.post(`${TOTAL_BASE_URI}/api/tokenbazaar`, { username: TOTAL_USERNAME, pass: TOTAL_PASSWORD });

    return data.token;
};

export { getTotalToken }