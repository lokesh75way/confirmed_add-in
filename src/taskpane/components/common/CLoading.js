import ClipLoader from "react-spinners/ClipLoader"

export default function CLoading() {
    const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary');
    return (
        <ClipLoader color={primaryColor} className="header-margin"/>
    );
}
