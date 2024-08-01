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
macro_rules! get_by_id {
    ($state:expr, $($path:ident).+, $id:expr) => {{
        let state = $state.lock().unwrap();
        let collection = &state.$($path).+;
        match collection.iter().find(|s| s.id == $id) {
            Some(s) => Ok(s.clone()),
            None => Err(format!("{} not found", $id)),
        }
    }};
}

#[macro_export]
macro_rules! delete_by_id {
    ($state:expr, $($path:ident).+, $id:expr) => {{
        let mut state = $state.lock().unwrap();
        let index = state.$($path).+.iter().position(|s| s.id == $id).expect("Item not found");
        state.$($path).+.remove(index);
    }};
}

#[macro_export]
macro_rules! update_by_id {
    ($state:expr, $($path:ident).+, $data:expr) => {{
        let mut state = $state.lock().unwrap();
        let index = state.$($path).+.iter().position(|s| s.id == $data.id).expect("Item not found");
        state.$($path).+[index] = $data;
    }};
}

#[macro_export]
macro_rules! create_object {
    ($state:expr, $($path:ident).+, $builder:ty, $id:expr) => {
        let mut state = $state.lock().unwrap();
        let mut object = <$builder>::default();

        let id = get_id($id, &mut state);
        object.id(id);

        state.$($path).+.push(
            object
            .build()
            .expect("Failed to build object")
        );
    };
}