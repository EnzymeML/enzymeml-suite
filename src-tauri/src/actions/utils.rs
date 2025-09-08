/// Generates a unique identifier with a given prefix.
///
/// This function takes a vector of existing IDs and a prefix string, and generates
/// a new unique ID by appending an incrementing number to the prefix if necessary.
///
/// # Arguments
///
/// * `ids` - A reference to a vector of existing IDs.
/// * `prefix` - A string slice that holds the prefix for the new ID.
///
/// # Returns
///
/// A `String` representing the new unique ID.
pub fn generate_id(ids: &Vec<String>, prefix: &str) -> String {
    let mut i = 1;
    let mut id = format!("{}{}", prefix, i);
    while ids.contains(&id) {
        id = format!("{}{}", prefix, i);
        i += 1;
    }
    id
}
