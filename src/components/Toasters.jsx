import React, { useState } from "react";
const numToasters = React.props;


export default function Toasters(props) {  
    return (
        <div class="pt-2">
            <div class=" text-lg">Rating: <span class="font-bold">{props.numToasters}/10 Toasters</span></div>
            <div class="p-1.5 bg-primary inline-flex rounded space-x-1">
                    {[...Array(props.numToasters)].map((star) => {        
                    return (         
                        <div>
                            <img  class="h-6" src="/images/icons/btoaster.png"></img>
                        </div>
                    );
                    })}
                    {[...Array(10-props.numToasters)].map((star) => {        
                    return (         
                        <div>
						    <img  class="h-6 grayscale opacity-50" src="/images/icons/btoaster.png"></img>
                        </div>
                    );
                    })}
            </div>
        </div>
    );
  };


