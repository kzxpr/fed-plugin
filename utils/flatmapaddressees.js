
function flatMapAddressees(arr, field, type = null){
    return arr.flatMap((v) => {
        if(v.field==field){
            if(type===null){
                return [ v.account_uri ]
            }else{
                if(v.type==type){
                    return [ v.account_uri ]
                }else{
                    return [];
                }
            }
        }else{
            return []; // skip
        }
    })
}

module.exports = { flatMapAddressees }