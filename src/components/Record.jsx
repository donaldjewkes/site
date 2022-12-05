import React, { useState } from "react";
const numToasters = React.props;

export default function Record(props) {
    const [isActive, setActive] = useState(false);
  
    const toggleClass = () => {
      setActive(!isActive);
    };
  
    return (
      <div 
        className={isActive ? 'rotate-45': null} 
        onClick={toggleClass} 
      >
        <p>donald</p>
      </div>
     );
  }  

// export function Record() {
//     const [className, setClassName] = useState('');

//     function handleClick() {

//         setClassName('rotate-45');
//     }

//     // const handleClick = event => {
//     //     // 👇️ toggle isActive state on click
//     //     event.currentTarget.classList.toggle('animate-spin');
//     //   };
  
//     return (
//         <button onClick={handleClick} className={className}>
//             <div className="h-12 w-12 bg-black">
//                 click me
//             </div>
//         </button>

// 		//<iframe onClick={handleClick} className={isActive ? 'animate-spin' : ''} src="https://open.spotify.com/embed/album/4h5av08hHhOyyINApKfnEE?utm_source=generator" width="80" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
//     );
//   }


