import { modelProyecto, modelUsuario, Usuario, Proyecto, modelTarea, Tarea, TaskByID} from "./types.ts";


export const fromModeltoUser=(model: modelUsuario):Usuario =>{
    return{
        id: model._id.toString(),
        name: model.name,
        email: model.email,
        created_at: model.created_at
    }
}

export const fromModeltoProject = (model:modelProyecto):Proyecto => {
    return{
        id: model._id.toString(),
        name: model.name,
        description: model.description,
        start_date: model.start_date,
        end_date: model.end_date,
        user_id: model.user_id.toString()
    }
}

export const fromModeltoProjectbyID = (model: modelProyecto):Proyecto => {
    return{
        id: model._id.toString(),
        name: model.name,
        description: model.description,
        start_date: model.start_date,
        end_date: model.end_date
    }
}

export const fromModelToTask = (model: modelTarea):Tarea => ({
    id: model._id.toString(),
    title: model.title,
    description: model.description,
    status: model.status,
    created_at: model.created_at,
    due_date: model.due_date,
    project_id: model.project_id.toString()
})

export const fromModelToTaskbyID = (model: modelTarea):TaskByID => ({
    id: model._id.toString(),
    title: model.title,
    description: model.description,
    status: model.status,
    created_at: model.created_at,
    due_date: model.due_date,
})