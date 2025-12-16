const Search=()=>{
    return(<div className="border-4 border-red-500 flex-1 flex flex-col justify-center items-center  text-orange-100">
        <div className="text-6xl  text-orange-500 mb-4">
            Poogle
        </div>

        <div className="flex bg-orange-200 border border-orange-200 p-2 w-80 rounded-full">
            <input className="flex-1 bg-orange-200 mx-4"/>
            
        </div>
        <div className="mt-4">
            <button className="m-1 rounded-md bg-violet-200 text-violet-400 px-4 py-2">Poogle Search</button>
            <button className="m-1 rounded-md bg-violet-200 text-violet-400 px-4 py-2">Image Search</button>
        </div>
        
    </div>);
};
export default Search;