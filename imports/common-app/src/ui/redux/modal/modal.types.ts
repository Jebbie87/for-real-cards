
export interface IModalState { // TODO: Add type paremeters like IModalState<PARAMS, RESULT>
  params:any,
  result:any,
  displaying:boolean
}

export interface IModalActionPayload {
  component?:any,
  params?:any,
  result?:any
}



