#[macro_export]
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
///
/// # Returns
///
/// * `Ok(s.clone())` - If an item with the given ID is found, it returns a clone of the item.
/// * `Err(format!("{} not found", $id))` - If no item with the given ID is found, it returns an error message.
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
///
/// # Panics
///
/// This macro will panic if the item with the given ID is not found in the collection.
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
///
/// # Panics
///
/// This macro will panic if the object fails to build.
#[macro_export]
macro_rules! create_object {
    ($state:expr, $($path:ident).+, $builder:ty, $prefix:expr, $id_prop:ident) => {{
        let mut state = $state.lock().unwrap();
        let mut object = <$builder>::default();

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