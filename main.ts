import { MongoClient, ObjectId } from 'mongodb'
import { fromModeltoProject, fromModeltoProjectbyID, fromModelToTask, fromModelToTaskbyID, fromModeltoUser } from "./utils.ts";
import { modelProyecto ,modelTarea, modelUsuario } from "./types.ts";


// Connection URL
const url = Deno.env.get("MONGO_URL");
const client = new MongoClient(url);

// Database Name
const dbName = 'P4';
// Use connect method to connect to the server
await client.connect();
console.log('Connected successfully to server');
const db = client.db(dbName);
const usersCollection = db.collection<modelUsuario>('users');
const projectsCollection = db.collection<modelProyecto>("projects");
const tasksCollection = db.collection<modelTarea>("tasks");

const handler = async (req:Request):Promise<Response> => {
const method = req.method;
const url = new URL(req.url);
const path = url.pathname;

if(method === "GET"){
  if(path === "/users"){
    const usersDB = await usersCollection.find().toArray();
    const users = usersDB.map((u) => fromModeltoUser(u));
    return new Response(JSON.stringify(users));

  }else if(path === "/projects"){
    const projectsDB = await projectsCollection.find().toArray();
    const projects = projectsDB.map((p) => fromModeltoProject(p));
    return new Response(JSON.stringify(projects));
  
  } else if (path === "/projects/by-user"){
    const user_id_param = url.searchParams.get("user_id");
    const projectsDB = await projectsCollection.find({user_id: new ObjectId(user_id_param)}).toArray();
    const projects = projectsDB.map((p) => fromModeltoProjectbyID(p));
    return new Response(JSON.stringify(projects));

  }else if(path === "/tasks"){
    const tasksDB = await tasksCollection.find().toArray()
    const tasks = tasksDB.map((t) => fromModelToTask(t))
    return new Response(JSON.stringify(tasks))

  } else if (path === "/tasks/by-project"){
    const project_id_param = url.searchParams.get("project_id");
    const tasksDB = await tasksCollection.find({project_id: new ObjectId(project_id_param)}).toArray();
    const tasks = tasksDB.map((t) => fromModelToTaskbyID(t));
    return new Response(JSON.stringify(tasks));
  }
} else if(method === "POST"){
  if(path === "/users"){
    const user = await req.json();
    const {insertedId} = await usersCollection.insertOne({
      name: user.name,
      email: user.email,
      created_at: new Date()
    })
    const insertedUserDB = await usersCollection.findOne({_id: insertedId});
    if(insertedUserDB){
    return new Response(JSON.stringify(fromModeltoUser(insertedUserDB)));
    }

  } else if(path === "/projects"){
    const project = await req.json();
    const existingUser = await usersCollection.findOne({_id: new ObjectId(project.user_id)});
    if(existingUser){
      const {insertedId} = await projectsCollection.insertOne({
        name: project.name,
        description: project.description,
        start_date:  project.start_date,
        end_date: undefined,
        user_id: existingUser._id
      })
      const insertedProjectDB = await projectsCollection.findOne({_id: insertedId});
      if(insertedProjectDB) {return new Response(JSON.stringify(fromModeltoProject(insertedProjectDB)));};
    }

  } else if(path === "/tasks"){
    const tarea = await req.json()
    if(!tarea.title || !tarea.description  || !tarea.status || !tarea.due_date || !tarea.project_id){
      return new Response("Bad request. . .")
    }

    const { insertedId } = await tasksCollection.insertOne({
      title: tarea.title,
      description: tarea.description,
      status: tarea.status,
      created_at: new Date(),
      due_date: tarea.due_date,
      project_id: new ObjectId(tarea.project_id)
    })

    const insertedTask = await tasksCollection.findOne({_id: insertedId});
    if(insertedTask){ return new Response(JSON.stringify(fromModelToTask((insertedTask)))); }
  } else if (path === "/tasks/move"){
    const { task_id, destination_project_id, origin_project_id } = await req.json();
  
    if (!task_id || !destination_project_id) {
      return new Response(JSON.stringify({
        error: true,
        status: 400,
        message: "task_id y destination_project_id son obligatorios."
      }), { status: 400 });
    }
  
    const task = await tasksCollection.findOne({ _id: new ObjectId(task_id) });
    if (!task) {
      return new Response(JSON.stringify({
        error: true,
        status: 404,
        message: "Task not found."
      }), { status: 404 });
    }
  
    const destinationProject = await projectsCollection.findOne({ _id: new ObjectId(destination_project_id) });
    if (!destinationProject) {
      return new Response(JSON.stringify({
        error: true,
        status: 404,
        message: "Destination project not found."
      }), { status: 404 });
    }
  
    await tasksCollection.updateOne(
      { _id: new ObjectId(task_id) },
      { $set: { project_id: new ObjectId(destination_project_id) } }
    );
  
    const updatedTask = await tasksCollection.findOne({ _id: new ObjectId(task_id) });
  
    return new Response(JSON.stringify({
      message: "Task moved successfully",
      task: updatedTask
    }), { status: 200 });
  }

} else if(method === "DELETE"){
  if(path === "/tasks"){
    const id = url.searchParams.get("id")
    if(!id){
      return new Response("Bad request")
    }
    const taskToDelete = await tasksCollection.findOne({_id: new ObjectId(id)})
    if(!taskToDelete){
      return new Response("No se ha encontrado la tarea a eliminar. . .")
    }
    tasksCollection.deleteOne({_id: new ObjectId(id)})
    return new Response(JSON.stringify({ message: "Task deleted successfully." }), { status: 200 });
  } else if(path === "/users"){
    const id = url.searchParams.get("id")
    if(!id){
      return new Response("Bad request");
    }
    const userToDelete = await usersCollection.findOne({_id: new ObjectId(id)})
    if(!userToDelete){
      return new Response("No se ha encontrado la tarea a eliminar. . .")
    }
    usersCollection.deleteOne({_id: new ObjectId(id)})
    return new Response(JSON.stringify({ message: "User deleted successfully." }), { status: 200 });
  } else if(path === "/projects"){
    const id = url.searchParams.get("id")
    if(!id){
      return new Response("Bad request");
    }
    const projectToDelete = await projectsCollection.findOne({_id: new ObjectId(id)})
    if(!projectToDelete){
      return new Response("No se ha encontrado la tarea a eliminar. . .")
    }
    projectsCollection.deleteOne({_id: new ObjectId(id)})
    return new Response(JSON.stringify({ message: "Project deleted successfully." }), { status: 200 });
}
}

}


Deno.serve({ port: 3000 }, handler);