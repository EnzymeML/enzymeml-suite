/// Macro to retrieve an item by its ID from a nested collection.
///
/// This macro takes a struct, a path to a nested collection within the struct, and an ID.
/// It searches for an item with the given ID in the collection and returns a result.
///
/// # Arguments
///
/// * `$struct` - The struct containing the nested collection.
/// * `$($path).+` - The path to the nested collection within the struct.
/// * `$id` - The ID of the item to retrieve.
/// * `$id_prop` - The property of the item that contains the ID.
///
/// # Returns
///
/// * `Ok(s.clone())` - If an item with the given ID is found, it returns a clone of the item.
/// * `Err(format!("{} not found", $id))` - If no item with the given ID is found, it returns an error message.
#[macro_export]
macro_rules! get_object {
    ($state:expr, $($path:ident).+, $id:expr, $id_prop:ident) => {{
        let state = $state.lock().unwrap();
        let collection = &state.$($path).+;
        match collection.iter().find(|s| s.$id_prop == $id) {
            Some(s) => Ok(s.clone()),
            None => {
                Err(format!("{:?} not found", $id))
            }
        }
    }};
}

/// Macro to delete an item by its ID from a nested collection.
///
/// This macro takes a struct, a path to a nested collection within the struct, and an ID.
/// It searches for an item with the given ID in the collection and removes it.
///
/// # Arguments
///
/// * `$state` - The state containing the nested collection, wrapped in a `Mutex`.
/// * `$($path).+` - The path to the nested collection within the state.
/// * `$id` - The ID of the item to delete.
/// * `$id_prop` - The property of the item that contains the ID.
///
/// # Behavior
///
/// If the item with the given ID is found, it is removed from the collection.
/// If the item is not found, the operation silently succeeds without error.
#[macro_export]
macro_rules! delete_object {
    ($state:expr, $($path:ident).+, $id:expr, $id_prop:ident) => {{
        let mut state = $state.lock().unwrap();
        let index = state.$($path).+.iter().position(|s| s.$id_prop == $id);

        match index {
            Some(index) => {state.$($path).+.remove(index);}
            None => {}
        };
    }};
}

/// Macro to update an item by its ID in a nested collection.
///
/// This macro takes a state, a path to a nested collection within the state, and the new data.
/// It searches for an item with the given ID in the collection and updates it with the new data.
///
/// # Arguments
///
/// * `$state` - The state containing the nested collection, wrapped in a `Mutex`.
/// * `$($path).+` - The path to the nested collection within the state.
/// * `$data` - The new data to update the item with.
/// * `$id_prop` - The property of the item that contains the ID.
///
/// # Returns
///
/// Returns the ID of the updated item.
///
/// # Panics
///
/// This macro will panic if the item with the given ID is not found in the collection.
#[macro_export]
macro_rules! update_object {
    ($state:expr, $($path:ident).+, $data:expr, $id_prop:ident) => {{
        let mut state = $state.lock().unwrap();
        let index = state.$($path).+.iter().position(|s| s.$id_prop == $data.$id_prop)
            .expect("Item not found");
        state.$($path).+[index] = $data;

        let id = state.$($path).+[index].$id_prop.clone();
        id
    }};
}

/// Macro to create a new object in a nested collection.
///
/// This macro takes a state, a path to a nested collection within the state, a builder type, and a prefix.
/// It generates a unique ID for the new object, sets the ID, and then pushes the built object into the collection.
///
/// # Arguments
///
/// * `$state` - The state containing the nested collection, wrapped in a `Mutex`.
/// * `$($path).+` - The path to the nested collection within the state.
/// * `$builder` - The builder type used to create the new object.
/// * `$prefix` - The prefix used to generate a unique ID for the new object.
/// * `$id_prop` - The property of the item that contains the ID.
///
/// # Returns
///
/// Returns the generated ID of the new object.
///
/// # Panics
///
/// This macro will panic if the object fails to build.
#[macro_export]
macro_rules! create_object {
    ($state:expr, $($path:ident).+, $builder:expr, $prefix:expr, $id_prop:ident) => {{
        let mut state = $state.lock().unwrap();
        let mut object = $builder;

        // Get the id and set it
        let ids: Vec<_> = state.$($path).+.iter().map(|s| s.$id_prop.clone()).collect();
        let id = generate_id(&ids, $prefix);

        object.$id_prop(id.clone());

        state.$($path).+.push(
            object
                .build()
                .expect("Failed to build object")
        );

        id
    }};
}

/// Macro to add an object to a nested collection.
///
/// This macro takes a state, a path to a nested collection within the state, and an object.
/// It pushes the object into the collection without generating a new ID or modifying the object.
/// This is useful when adding pre-built objects that already have their properties set.
///
/// # Arguments
///
/// * `$state` - The state containing the nested collection, wrapped in a `Mutex`.
/// * `$($path).+` - The path to the nested collection within the state.
/// * `$object` - The object to add to the collection.
///
/// # Panics
///
/// This macro will panic if it fails to acquire the mutex lock on the state.
#[macro_export]
macro_rules! add_object {
    ($state:expr, $($path:ident).+, $object:expr) => {{
        let mut state = $state.lock().unwrap();
        state.$($path).+.push($object);
    }};
}

/// Macro to add multiple objects to a nested collection.
///
/// This macro takes a state, a path to a nested collection within the state, and a vector of objects.
/// It pushes the objects into the collection without generating a new IDs or modifying the objects.
/// This is useful when adding pre-built objects that already have their properties set.
///
/// # Arguments
///
/// * `$state` - The state containing the nested collection, wrapped in a `Mutex`.
/// * `$($path).+` - The path to the nested collection within the state.
/// * `$objects` - The vector of objects to add to the collection.
///
/// # Panics
///
/// This macro will panic if it fails to acquire the mutex lock on the state.
#[macro_export]
macro_rules! add_objects {
    ($state:expr, $($path:ident).+, $objects:expr) => {{
        let mut state = $state.lock().unwrap();
        state.$($path).+.extend($objects);
    }};
}

/// Macro to emit an update event to all listeners.
///
/// This macro takes an app handle and an event name, and emits the event to all listeners.
/// It provides a convenient way to notify the frontend about state changes.
///
/// # Arguments
///
/// * `$app_handle` - The Tauri app handle used to emit events.
/// * `$event` - The name of the event to emit.
///
/// # Panics
///
/// This macro will panic if it fails to emit the event.
#[macro_export]
macro_rules! update_event {
    ($app_handle:expr, $event:expr) => {
        $app_handle.emit($event, ()).expect("Failed to emit event");
    };
    () => {};
}

/// Macro to update the validation report and emit an update event.
///
/// This macro takes a state and an app handle, updates the validation report
/// in the state, and then emits an "update_report" event to notify the frontend
/// about the report changes.
///
/// # Usage Patterns
///
/// 1. Without document reference (locks internally):
///    `update_report!(state, app_handle)`
///
/// 2. With document reference (avoids deadlock when already locked):
///    `update_report!(state, app_handle, &doc)`
///
/// # Arguments
///
/// * `$state` - The state containing the validation report, wrapped in a `Mutex`.
/// * `$app_handle` - The Tauri app handle used to emit events.
/// * `$doc` - (Optional) A reference to the EnzymeML document when already locked.
///
/// # Panics
///
/// This macro will panic if it fails to acquire the mutex lock on the state
/// or if it fails to emit the event.
#[macro_export]
macro_rules! update_report {
    // Pattern with document reference (avoids deadlock)
    ($state:expr, $app_handle:expr, $doc:expr) => {
        $state.update_report_with_doc($doc);
        $app_handle
            .emit("update_report", ())
            .expect("Failed to emit event");
    };
    // Pattern without document reference (locks internally)
    ($state:expr, $app_handle:expr) => {
        $state.update_report();
        $app_handle
            .emit("update_report", ())
            .expect("Failed to emit event");
    };
}
